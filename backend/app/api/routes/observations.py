import os
import uuid
from datetime import datetime, timezone

from fastapi import APIRouter, Depends, HTTPException, UploadFile, File, Form
from sqlalchemy.orm import Session

from app.core.config import settings
from app.core.deps import require_roles, get_current_user
from app.db.session import get_db
from app.models.user import User, UserRole
from app.models.observation import Observation, ObservationType, ObservationDetection
from app.models.survey import MonitoringSite
from app.schemas.observation import (
    ObservationCreate,
    ObservationOut,
    BoundingBox,
    DetectionItem,
    DetectionResult,
    SoundMatch,
    SoundDetectionResult,
)
from app.services.vision_service import detect_animals
from app.services.audio_service import classify_animal_sound

router = APIRouter(prefix="/observations", tags=["Observations (Multi-Modal Ingestion)"])

CAN_INGEST = (UserRole.ADMINISTRATOR, UserRole.RESEARCHER, UserRole.FOREST_DEPARTMENT)


def _disk_path_for(file_reference: str) -> str:
    """Maps a stored file_reference (e.g. '/uploads/observations/<id>/<f>') to its disk path."""
    prefix = "/uploads/"
    rel = file_reference[len(prefix):] if file_reference.startswith(prefix) else file_reference
    return os.path.join(settings.UPLOAD_DIR, rel)


@router.post("/", response_model=ObservationOut, status_code=201)
def ingest_observation(
    payload: ObservationCreate,
    db: Session = Depends(get_db),
    current_user: User = Depends(require_roles(*CAN_INGEST)),
):
    """
    FR-3: Multi-Modal Dataset Ingestion.
    Registers a raw image/audio/telemetry capture against a monitoring
    site. species_label / confidence_score stay null here - they are
    filled in by the Milestone 2 detection pipeline (see /detect below).
    """
    site = db.query(MonitoringSite).filter(MonitoringSite.id == payload.site_id).first()
    if not site:
        raise HTTPException(status_code=404, detail="Monitoring site not found.")

    observation = Observation(**payload.model_dump())
    db.add(observation)
    db.commit()
    db.refresh(observation)
    return observation


# ---- Milestone 2: Species Recognition workflow ----
# NOTE: static-path routes ("/upload-image") must be declared before the
# dynamic "/{observation_id}..." routes below, or FastAPI will try to match
# "upload-image" as an observation_id.

@router.post("/upload-image", response_model=ObservationOut, status_code=201)
async def upload_observation_image(
    file: UploadFile = File(...),
    site_id: str | None = Form(None),
    notes: str | None = Form(None),
    db: Session = Depends(get_db),
    current_user: User = Depends(require_roles(*CAN_INGEST)),
):
    """
    Feature 1 (Image Upload): stores a camera-trap-style photo on disk
    (reusing the same static-file pattern as dataset file uploads) and
    creates an Observation row (observation_type="image").

    site_id is optional - if omitted this is the "no survey yet, just
    testing" quick mode; if provided, the image is attached to that
    monitoring site like any other field observation.
    """
    content_type = file.content_type or ""
    if not content_type.startswith("image/"):
        raise HTTPException(
            status_code=400,
            detail=f"Unsupported file type '{content_type}'. Species recognition uploads must be images.",
        )

    if site_id:
        site = db.query(MonitoringSite).filter(MonitoringSite.id == site_id).first()
        if not site:
            raise HTTPException(status_code=404, detail="Monitoring site not found.")

    max_bytes = settings.MAX_UPLOAD_SIZE_MB * 1024 * 1024
    contents = await file.read()
    if len(contents) > max_bytes:
        raise HTTPException(
            status_code=400,
            detail=f"'{file.filename}' exceeds the {settings.MAX_UPLOAD_SIZE_MB}MB upload limit.",
        )

    observation_id = str(uuid.uuid4())
    obs_dir = os.path.join(settings.UPLOAD_DIR, "observations", observation_id)
    os.makedirs(obs_dir, exist_ok=True)

    ext = os.path.splitext(file.filename or "")[1] or ".jpg"
    stored_filename = f"{uuid.uuid4().hex}{ext}"
    disk_path = os.path.join(obs_dir, stored_filename)
    with open(disk_path, "wb") as f:
        f.write(contents)

    observation = Observation(
        id=observation_id,
        site_id=site_id or None,
        observation_type=ObservationType.IMAGE,
        file_reference=f"/uploads/observations/{observation_id}/{stored_filename}",
        captured_at=datetime.now(timezone.utc),
        notes=notes,
    )
    db.add(observation)
    db.commit()
    db.refresh(observation)
    return observation


@router.post("/upload-audio", response_model=ObservationOut, status_code=201)
async def upload_observation_audio(
    file: UploadFile = File(...),
    site_id: str | None = Form(None),
    notes: str | None = Form(None),
    db: Session = Depends(get_db),
    current_user: User = Depends(require_roles(*CAN_INGEST)),
):
    """
    Milestone 3 Feature A: mirrors upload_observation_image but for audio
    recordings (observation_type="audio"). Stores the raw file on disk
    using the same /uploads/observations/<id>/<file> layout so the
    existing static-file mount serves it back for an <audio> player.
    """
    content_type = file.content_type or ""
    if not content_type.startswith("audio/"):
        raise HTTPException(
            status_code=400,
            detail=f"Unsupported file type '{content_type}'. Sound detection uploads must be audio.",
        )

    if site_id:
        site = db.query(MonitoringSite).filter(MonitoringSite.id == site_id).first()
        if not site:
            raise HTTPException(status_code=404, detail="Monitoring site not found.")

    max_bytes = settings.MAX_UPLOAD_SIZE_MB * 1024 * 1024
    contents = await file.read()
    if len(contents) > max_bytes:
        raise HTTPException(
            status_code=400,
            detail=f"'{file.filename}' exceeds the {settings.MAX_UPLOAD_SIZE_MB}MB upload limit.",
        )

    observation_id = str(uuid.uuid4())
    obs_dir = os.path.join(settings.UPLOAD_DIR, "observations", observation_id)
    os.makedirs(obs_dir, exist_ok=True)

    ext = os.path.splitext(file.filename or "")[1] or ".wav"
    stored_filename = f"{uuid.uuid4().hex}{ext}"
    disk_path = os.path.join(obs_dir, stored_filename)
    with open(disk_path, "wb") as f:
        f.write(contents)

    observation = Observation(
        id=observation_id,
        site_id=site_id or None,
        observation_type=ObservationType.AUDIO,
        file_reference=f"/uploads/observations/{observation_id}/{stored_filename}",
        captured_at=datetime.now(timezone.utc),
        notes=notes,
    )
    db.add(observation)
    db.commit()
    db.refresh(observation)
    return observation


@router.post("/{observation_id}/detect-sound", response_model=SoundDetectionResult)
def detect_sound(
    observation_id: str,
    db: Session = Depends(get_db),
    current_user: User = Depends(require_roles(*CAN_INGEST)),
):
    """
    Feature A (Bioacoustic Recognition Engine): runs the pretrained
    YAMNet model against this observation's stored audio file, saves the
    top-confidence label/score onto the Observation row (mirroring how
    /detect works for images), and returns the full result including
    all animal-relevant matches.
    """
    observation = db.query(Observation).filter(Observation.id == observation_id).first()
    if not observation:
        raise HTTPException(status_code=404, detail="Observation not found.")
    if observation.observation_type != ObservationType.AUDIO:
        raise HTTPException(
            status_code=400, detail="Sound detection is only supported for audio observations."
        )

    disk_path = _disk_path_for(observation.file_reference)
    if not os.path.exists(disk_path):
        raise HTTPException(status_code=404, detail="Underlying audio file not found on disk.")

    try:
        result = classify_animal_sound(disk_path)
    except RuntimeError as exc:
        # Real failure (e.g. the pretrained model's weights could not be
        # downloaded) - surfaced honestly as a 502, never masked as a
        # fabricated detection result.
        raise HTTPException(status_code=502, detail=str(exc)) from exc

    observation.species_label = result["label"]
    observation.confidence_score = result["confidence"]
    db.commit()

    return SoundDetectionResult(
        observation_id=observation_id,
        detected=result["label"] is not None,
        label=result["label"],
        confidence=result["confidence"],
        all_matches=[SoundMatch(**m) for m in result["all_matches"]],
    )


@router.post("/{observation_id}/detect", response_model=DetectionResult)
def detect_species(
    observation_id: str,
    db: Session = Depends(get_db),
    current_user: User = Depends(require_roles(*CAN_INGEST)),
):
    """
    Feature 2 (Animal Detection): runs the pretrained YOLOv8 model
    against this observation's stored image, saves the top-confidence
    label/score onto the Observation row, and returns every detected
    animal (with bounding boxes) - not just the top one. Re-running this
    on the same observation replaces its previous detections.
    """
    observation = (
        db.query(Observation).filter(Observation.id == observation_id).first()
    )
    if not observation:
        raise HTTPException(status_code=404, detail="Observation not found.")
    if observation.observation_type != ObservationType.IMAGE:
        raise HTTPException(
            status_code=400, detail="Species detection is only supported for image observations."
        )

    disk_path = _disk_path_for(observation.file_reference)
    if not os.path.exists(disk_path):
        raise HTTPException(status_code=404, detail="Underlying image file not found on disk.")

    result = detect_animals(disk_path)

    # Re-runnable: clear any prior detections for this observation first.
    db.query(ObservationDetection).filter(
        ObservationDetection.observation_id == observation_id
    ).delete()

    detection_items: list[DetectionItem] = []
    top_label: str | None = None
    top_confidence: float | None = None

    for i, d in enumerate(result["detections"]):
        row = ObservationDetection(
            observation_id=observation_id,
            label=d["label"],
            confidence=d["confidence"],
            bbox_x=d["bbox"]["x"],
            bbox_y=d["bbox"]["y"],
            bbox_width=d["bbox"]["width"],
            bbox_height=d["bbox"]["height"],
        )
        db.add(row)
        detection_items.append(
            DetectionItem(label=d["label"], confidence=d["confidence"], bbox=BoundingBox(**d["bbox"]))
        )
        if i == 0:
            top_label = d["label"]
            top_confidence = d["confidence"]

    observation.species_label = top_label
    observation.confidence_score = top_confidence
    db.commit()

    return DetectionResult(
        observation_id=observation_id,
        detected=result["detected"],
        count=result["count"],
        detections=detection_items,
        top_label=top_label,
        top_confidence=top_confidence,
    )


@router.get("/{observation_id}/detections", response_model=DetectionResult)
def get_detections(
    observation_id: str,
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user),
):
    """Returns the most recently saved detections for an observation (no re-run)."""
    observation = db.query(Observation).filter(Observation.id == observation_id).first()
    if not observation:
        raise HTTPException(status_code=404, detail="Observation not found.")

    rows = (
        db.query(ObservationDetection)
        .filter(ObservationDetection.observation_id == observation_id)
        .order_by(ObservationDetection.confidence.desc())
        .all()
    )
    items = [
        DetectionItem(
            label=r.label,
            confidence=r.confidence,
            bbox=BoundingBox(x=r.bbox_x, y=r.bbox_y, width=r.bbox_width, height=r.bbox_height),
        )
        for r in rows
    ]
    return DetectionResult(
        observation_id=observation_id,
        detected=len(items) > 0,
        count=len(items),
        detections=items,
        top_label=observation.species_label,
        top_confidence=observation.confidence_score,
    )


@router.get("/{observation_id}", response_model=ObservationOut)
def get_observation(
    observation_id: str,
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user),
):
    observation = db.query(Observation).filter(Observation.id == observation_id).first()
    if not observation:
        raise HTTPException(status_code=404, detail="Observation not found.")
    return observation


@router.get("/", response_model=list[ObservationOut])
def list_observations(
    site_id: str | None = None,
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user),
):
    query = db.query(Observation)
    if site_id:
        query = query.filter(Observation.site_id == site_id)
    return query.order_by(Observation.captured_at.desc()).all()
