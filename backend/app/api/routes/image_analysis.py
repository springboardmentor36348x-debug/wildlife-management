import os
import uuid
from typing import Optional

from fastapi import APIRouter, Depends, UploadFile, File, Form, HTTPException
from sqlalchemy.orm import Session

from app.database import get_db
from app.api.deps import get_current_user
from app.models.user import User
from app.models.species_prediction import SpeciesPrediction
from app.models.species_catalog import SpeciesCatalog
from app.models.observation import Observation
from app.schemas.species_prediction import SpeciesPredictionResponse
from app.services.image_classifier import predict_species, is_model_ready, ModelNotTrainedError

router = APIRouter(prefix="/image-analysis", tags=["Wildlife Image Analysis Engine"])

UPLOAD_DIR = os.path.join("uploads", "images")
os.makedirs(UPLOAD_DIR, exist_ok=True)

VALID_EXTENSIONS = (".jpg", ".jpeg", ".png")
ENDANGERED_STATUSES = {"endangered", "critically endangered", "vulnerable"}


@router.get("/status")
def model_status():
    return {"model_ready": is_model_ready()}


@router.post("/predict", response_model=SpeciesPredictionResponse)
async def analyze_image(
    file: UploadFile = File(...),
    monitoring_site_id: Optional[str] = Form(None),
    camera_trap_id: Optional[str] = Form(None),
    log_as_observation: bool = Form(True),
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user),
):
    ext = os.path.splitext(file.filename)[1].lower()
    if ext not in VALID_EXTENSIONS:
        raise HTTPException(status_code=400, detail="Only .jpg/.jpeg/.png images are supported")

    content = await file.read()

    try:
        label, confidence = predict_species(content)
    except ModelNotTrainedError as e:
        raise HTTPException(status_code=503, detail=str(e))

    # Save the image so it can be reviewed / used to retrain later
    stored_name = f"{uuid.uuid4()}{ext}"
    stored_path = os.path.join(UPLOAD_DIR, stored_name)
    with open(stored_path, "wb") as f:
        f.write(content)

    # Normalize the model's label before matching against species_catalog —
    # model labels come from folder names (e.g. "BARN_OWL" or "BARN OWL"),
    # while catalog common_name is usually title case ("Barn Owl"). ilike()
    # is case-insensitive but not underscore-insensitive, so strip those first.
    normalized_label = label.replace("_", " ").strip()
    catalog_entry = db.query(SpeciesCatalog).filter(
        SpeciesCatalog.common_name.ilike(normalized_label)
    ).first()

    conservation_status = catalog_entry.conservation_status if catalog_entry else None
    taxonomic_group = catalog_entry.taxonomic_group if catalog_entry else None
    is_endangered = bool(
        conservation_status and conservation_status.strip().lower() in ENDANGERED_STATUSES
    )

    prediction = SpeciesPrediction(
        monitoring_site_id=monitoring_site_id,
        camera_trap_id=camera_trap_id,
        file_path=stored_path,
        predicted_species=label,
        confidence=confidence,
        taxonomic_group=taxonomic_group,
        conservation_status=conservation_status,
        is_endangered=is_endangered,
        created_by=current_user.id,
    )
    db.add(prediction)

    if log_as_observation and monitoring_site_id:
        db.add(Observation(
            monitoring_site_id=monitoring_site_id,
            camera_trap_id=camera_trap_id,
            species_name=label,
            observation_type="image",
            notes=f"Auto-detected by image analysis engine ({confidence:.0%} confidence)",
            recorded_by=current_user.id,
        ))

    db.commit()
    db.refresh(prediction)
    return prediction


@router.get("/", response_model=list[SpeciesPredictionResponse])
def list_predictions(
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user),
):
    if current_user.role in ["administrator", "conservation_officer", "forest_officer"]:
        return db.query(SpeciesPrediction).order_by(SpeciesPrediction.created_at.desc()).all()

    return db.query(SpeciesPrediction).filter(
        SpeciesPrediction.created_by == current_user.id
    ).order_by(SpeciesPrediction.created_at.desc()).all()




@router.delete("/{prediction_id}")
def delete_prediction(
    prediction_id: str,
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user),
):
    prediction = db.query(SpeciesPrediction).filter(SpeciesPrediction.id == prediction_id).first()
    if not prediction:
        raise HTTPException(status_code=404, detail="Detection not found")

    if current_user.role != "administrator" and prediction.created_by != current_user.id:
        raise HTTPException(status_code=403, detail="Not authorized to delete this detection")

    # Also remove the auto-logged observation this detection created, if any,
    # so deleting a detection doesn't leave an orphaned observation behind.
    if prediction.monitoring_site_id:
        db.query(Observation).filter(
            Observation.monitoring_site_id == prediction.monitoring_site_id,
            Observation.species_name == prediction.predicted_species,
            Observation.observation_type == "image",
            Observation.recorded_by == prediction.created_by,
        ).delete()

    db.delete(prediction)
    db.commit()
    return {"detail": "Detection and linked observation deleted successfully"}