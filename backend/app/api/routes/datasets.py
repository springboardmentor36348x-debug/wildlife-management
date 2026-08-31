import csv
import io
from fastapi import APIRouter, Depends, UploadFile, File
from sqlalchemy.orm import Session
from app.database import get_db
from app.models.species_catalog import SpeciesCatalog
from app.schemas.species_catalog import SpeciesResponse
from app.api.deps import get_current_user
from app.models.user import User

router = APIRouter(prefix="/datasets", tags=["Dataset Integration"])


@router.post("/import")
async def import_species_csv(
    source_dataset: str,
    file: UploadFile = File(...),
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user)
):
    content = await file.read()
    decoded = content.decode("utf-8")
    reader = csv.DictReader(io.StringIO(decoded))

    for row in reader:
        species = SpeciesCatalog(
            scientific_name=row.get("scientific_name"),
            common_name=row.get("common_name"),
            taxonomic_group=row.get("taxonomic_group"),
            conservation_status=row.get("conservation_status"),
            source_dataset=source_dataset
        )
        db.add(species)

    db.commit()
    return {"message": "Dataset imported successfully ✅"}


@router.get("/species", response_model=list[SpeciesResponse])
def list_species(
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user)
):
    return db.query(SpeciesCatalog).all()

import os
from app.services.dataset_service import scan_image_dataset

# Path on the backend server where the image dataset folder lives
IMAGE_DATASET_PATH = os.path.join("app", "..", "datasets", "Bird Speciees Dataset")


@router.post("/scan-images")
def scan_images(
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user)
):
    result = scan_image_dataset(
        base_path=IMAGE_DATASET_PATH,
        source_dataset="Bird Speciees Dataset",
        db=db
    )
    return {"message": "Image dataset indexed ✅", "summary": result}