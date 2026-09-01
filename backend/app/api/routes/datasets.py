import os
import uuid

from fastapi import APIRouter, Depends, HTTPException, UploadFile, File
from sqlalchemy.orm import Session

from app.core.config import settings
from app.core.deps import require_roles, get_current_user
from app.db.session import get_db
from app.models.user import User, UserRole
from app.models.observation import Dataset
from app.models.dataset_file import DatasetFile
from app.schemas.observation import DatasetCreate, DatasetOut
from app.schemas.dataset_file import DatasetFileOut

router = APIRouter(prefix="/datasets", tags=["Dataset Pipeline"])

CAN_MANAGE = (UserRole.ADMINISTRATOR, UserRole.RESEARCHER)

# Only these content-types are accepted for dataset sample uploads.
ALLOWED_CONTENT_PREFIXES = ("image/", "audio/")
ALLOWED_EXTRA_TYPES = ("text/csv", "application/json", "application/zip")


def _file_to_out(f: DatasetFile) -> DatasetFileOut:
    return DatasetFileOut(
        id=f.id,
        dataset_id=f.dataset_id,
        original_filename=f.original_filename,
        content_type=f.content_type,
        file_size_bytes=f.file_size_bytes,
        uploaded_by=f.uploaded_by,
        uploaded_at=f.uploaded_at,
        url=f"/uploads/datasets/{f.dataset_id}/{f.stored_filename}",
    )


@router.post("/", response_model=DatasetOut, status_code=201)
def register_dataset(
    payload: DatasetCreate,
    db: Session = Depends(get_db),
    current_user: User = Depends(require_roles(*CAN_MANAGE)),
):
    """
    Registers an external dataset (Snapshot Serengeti, iNaturalist,
    BirdCLEF, GBIF, Animal Kingdom...) for the Milestone 2 preprocessing
    pipeline to pick up. This milestone only tracks metadata.
    """
    dataset = Dataset(**payload.model_dump())
    db.add(dataset)
    db.commit()
    db.refresh(dataset)
    return dataset


@router.get("/", response_model=list[DatasetOut])
def list_datasets(
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user),
):
    return db.query(Dataset).order_by(Dataset.registered_at.desc()).all()


@router.delete("/{dataset_id}", status_code=204)
def remove_dataset(
    dataset_id: str,
    db: Session = Depends(get_db),
    current_user: User = Depends(require_roles(UserRole.ADMINISTRATOR)),
):
    dataset = db.query(Dataset).filter(Dataset.id == dataset_id).first()
    if not dataset:
        raise HTTPException(status_code=404, detail="Dataset not found.")
    db.delete(dataset)
    db.commit()


# ---- Real file uploads (images / audio / csv samples) ----

@router.post("/{dataset_id}/files", response_model=list[DatasetFileOut], status_code=201)
async def upload_dataset_files(
    dataset_id: str,
    files: list[UploadFile] = File(...),
    db: Session = Depends(get_db),
    current_user: User = Depends(require_roles(*CAN_MANAGE)),
):
    """
    Upload one or more real sample files (images/audio/csv/zip) for a
    registered dataset. Files are stored on disk under
    UPLOAD_DIR/datasets/<dataset_id>/ and tracked in the dataset_files table.
    """
    dataset = db.query(Dataset).filter(Dataset.id == dataset_id).first()
    if not dataset:
        raise HTTPException(status_code=404, detail="Dataset not found.")

    max_bytes = settings.MAX_UPLOAD_SIZE_MB * 1024 * 1024
    dataset_dir = os.path.join(settings.UPLOAD_DIR, "datasets", dataset_id)
    os.makedirs(dataset_dir, exist_ok=True)

    created: list[DatasetFile] = []
    for upload in files:
        content_type = upload.content_type or ""
        if not (
            content_type.startswith(ALLOWED_CONTENT_PREFIXES)
            or content_type in ALLOWED_EXTRA_TYPES
        ):
            raise HTTPException(
                status_code=400,
                detail=f"Unsupported file type '{content_type}' for '{upload.filename}'. "
                       f"Allowed: images, audio, CSV, JSON, ZIP.",
            )

        contents = await upload.read()
        if len(contents) > max_bytes:
            raise HTTPException(
                status_code=400,
                detail=f"'{upload.filename}' exceeds the {settings.MAX_UPLOAD_SIZE_MB}MB upload limit.",
            )

        ext = os.path.splitext(upload.filename or "")[1]
        stored_filename = f"{uuid.uuid4().hex}{ext}"
        disk_path = os.path.join(dataset_dir, stored_filename)
        with open(disk_path, "wb") as f:
            f.write(contents)

        record = DatasetFile(
            dataset_id=dataset_id,
            original_filename=upload.filename or stored_filename,
            stored_filename=stored_filename,
            content_type=content_type,
            file_size_bytes=len(contents),
            uploaded_by=current_user.id,
        )
        db.add(record)
        created.append(record)

    # Keep the dataset's record_count roughly reflective of real uploaded files.
    dataset.record_count = (dataset.record_count or 0) + len(created)
    db.commit()
    for record in created:
        db.refresh(record)

    return [_file_to_out(f) for f in created]


@router.get("/{dataset_id}/files", response_model=list[DatasetFileOut])
def list_dataset_files(
    dataset_id: str,
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user),
):
    dataset = db.query(Dataset).filter(Dataset.id == dataset_id).first()
    if not dataset:
        raise HTTPException(status_code=404, detail="Dataset not found.")
    files = (
        db.query(DatasetFile)
        .filter(DatasetFile.dataset_id == dataset_id)
        .order_by(DatasetFile.uploaded_at.desc())
        .all()
    )
    return [_file_to_out(f) for f in files]


@router.delete("/files/{file_id}", status_code=204)
def delete_dataset_file(
    file_id: str,
    db: Session = Depends(get_db),
    current_user: User = Depends(require_roles(*CAN_MANAGE)),
):
    record = db.query(DatasetFile).filter(DatasetFile.id == file_id).first()
    if not record:
        raise HTTPException(status_code=404, detail="File not found.")

    disk_path = os.path.join(settings.UPLOAD_DIR, "datasets", record.dataset_id, record.stored_filename)
    if os.path.exists(disk_path):
        os.remove(disk_path)

    dataset = db.query(Dataset).filter(Dataset.id == record.dataset_id).first()
    if dataset and dataset.record_count > 0:
        dataset.record_count -= 1

    db.delete(record)
    db.commit()
