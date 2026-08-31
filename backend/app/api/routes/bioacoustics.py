import os
import uuid
from typing import Optional

from fastapi import APIRouter, Depends, UploadFile, File, Form, HTTPException
from sqlalchemy.orm import Session

from app.database import get_db
from app.api.deps import get_current_user
from app.models.user import User
from app.models.audio_prediction import AudioPrediction
from app.models.observation import Observation
from app.models.species_catalog import SpeciesCatalog
from app.schemas.audio_prediction import AudioPredictionResponse
from app.services.audio_classifier import predict_species, is_model_ready, ModelNotTrainedError

router = APIRouter(prefix="/bioacoustics", tags=["Bioacoustic Recognition Engine"])

UPLOAD_DIR = os.path.join("uploads", "audio")
os.makedirs(UPLOAD_DIR, exist_ok=True)

VALID_EXTENSIONS = (".wav", ".mp3", ".flac", ".ogg")
ENDANGERED_STATUSES = {"endangered", "critically endangered", "vulnerable"}

TAXONOMIC_TO_CALL_TYPE = {
    "bird": "bird_call",
    "mammal": "mammal_vocalization",
    "amphibian": "amphibian_call",
    "insect": "insect_sound",
}


@router.get("/status")
def model_status():
    return {"model_ready": is_model_ready()}


@router.post("/predict", response_model=AudioPredictionResponse)
async def analyze_audio(
    file: UploadFile = File(...),
    monitoring_site_id: Optional[str] = Form(None),
    audio_sensor_id: Optional[str] = Form(None),
    call_type: Optional[str] = Form(None),
    log_as_observation: bool = Form(True),
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user),
):
    ext = os.path.splitext(file.filename)[1].lower()
    if ext not in VALID_EXTENSIONS:
        raise HTTPException(status_code=400, detail="Only .wav/.mp3/.flac/.ogg audio is supported")

    content = await file.read()

    try:
        label, confidence = predict_species(content)
    except ModelNotTrainedError as e:
        raise HTTPException(status_code=503, detail=str(e))

    # Match predicted label against species_catalog for conservation status + call type
    normalized_label = label.replace("_", " ").strip()
    catalog_entry = db.query(SpeciesCatalog).filter(
        SpeciesCatalog.common_name.ilike(normalized_label)
    ).first()

    conservation_status = catalog_entry.conservation_status if catalog_entry else None
    is_endangered = bool(
        conservation_status and conservation_status.strip().lower() in ENDANGERED_STATUSES
    )

    if not call_type and catalog_entry and catalog_entry.taxonomic_group:
        call_type = TAXONOMIC_TO_CALL_TYPE.get(catalog_entry.taxonomic_group.strip().lower())

    stored_name = f"{uuid.uuid4()}{ext}"
    stored_path = os.path.join(UPLOAD_DIR, stored_name)
    with open(stored_path, "wb") as f:
        f.write(content)

    prediction = AudioPrediction(
        monitoring_site_id=monitoring_site_id,
        audio_sensor_id=audio_sensor_id,
        file_path=stored_path,
        predicted_species=label,
        confidence=confidence,
        call_type=call_type,
        conservation_status=conservation_status,
        is_endangered=is_endangered,
        created_by=current_user.id,
    )
    db.add(prediction)

    if log_as_observation and monitoring_site_id:
        db.add(Observation(
            monitoring_site_id=monitoring_site_id,
            species_name=label,
            observation_type="audio",
            notes=f"Auto-detected by bioacoustic engine ({confidence:.0%} confidence)",
            recorded_by=current_user.id,
        ))

    db.commit()
    db.refresh(prediction)
    return prediction


@router.get("/", response_model=list[AudioPredictionResponse])
def list_predictions(
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user),
):
    if current_user.role in ["administrator", "conservation_officer", "forest_officer"]:
        return db.query(AudioPrediction).order_by(AudioPrediction.created_at.desc()).all()

    return db.query(AudioPrediction).filter(
        AudioPrediction.created_by == current_user.id
    ).order_by(AudioPrediction.created_at.desc()).all()




@router.delete("/{prediction_id}")
def delete_prediction(
    prediction_id: str,
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user),
):
    prediction = db.query(AudioPrediction).filter(AudioPrediction.id == prediction_id).first()
    if not prediction:
        raise HTTPException(status_code=404, detail="Detection not found")

    if current_user.role != "administrator" and prediction.created_by != current_user.id:
        raise HTTPException(status_code=403, detail="Not authorized to delete this detection")

    if prediction.monitoring_site_id:
        db.query(Observation).filter(
            Observation.monitoring_site_id == prediction.monitoring_site_id,
            Observation.species_name == prediction.predicted_species,
            Observation.observation_type == "audio",
            Observation.recorded_by == prediction.created_by,
        ).delete()

    db.delete(prediction)
    db.commit()
    return {"detail": "Detection and linked observation deleted successfully"}