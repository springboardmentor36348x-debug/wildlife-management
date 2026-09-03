"""
Wildlife Image Analysis Router (YOLOv8 + Vision Pipeline)
"""

import os
import shutil
import uuid
from datetime import datetime
from fastapi import APIRouter, Depends, HTTPException, UploadFile, File, Form, status
from sqlalchemy.orm import Session
from typing import Optional

from database import get_db
from models import Observation, ImageAnalysis, Species, Survey, User
from schemas.analysis import ImageAnalysisResult, SaveObservationFromAnalysis
from schemas.monitoring import ObservationResponse
from ai.image_detector import image_detector
from security import get_current_active_user

router = APIRouter()

UPLOAD_DIR = os.path.join("uploads", "images")
os.makedirs(UPLOAD_DIR, exist_ok=True)


@router.post("/analyze", response_model=ImageAnalysisResult)
async def analyze_wildlife_image(
    file: UploadFile = File(...),
    current_user: User = Depends(get_current_active_user)
):
    """
    Upload a camera-trap or field wildlife image.
    Executes YOLOv8 object detection, species classification, animal counting, and bounding boxes.
    """
    if not file.filename.lower().endswith(('.jpg', '.jpeg', '.png', '.webp', '.bmp')):
        raise HTTPException(
            status_code=400,
            detail="Invalid image format. Allowed formats: JPG, JPEG, PNG, WEBP, BMP"
        )

    # Save uploaded file
    file_ext = os.path.splitext(file.filename)[1]
    unique_filename = f"{uuid.uuid4().hex[:10]}_{file.filename}"
    saved_path = os.path.join(UPLOAD_DIR, unique_filename)

    with open(saved_path, "wb") as buffer:
        shutil.copyfileobj(file.file, buffer)

    # Run AI Detection Engine
    analysis_result = image_detector.analyze_image(saved_path, file.filename)
    analysis_result["file_path"] = f"/uploads/images/{unique_filename}"

    return analysis_result


@router.post("/save-observation", response_model=ObservationResponse)
def save_observation_from_image(
    save_in: SaveObservationFromAnalysis,
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_active_user)
):
    """Save an analyzed image detection into verified observations and linked image analysis table"""
    survey = db.query(Survey).filter(Survey.id == save_in.survey_id).first()
    if not survey:
        raise HTTPException(status_code=404, detail="Referenced survey not found")

    # Resolve or create species
    species_id = save_in.species_id
    if not species_id and save_in.species_name:
        # Search by name
        clean_name = save_in.species_name.split("(")[0].strip()
        sp = db.query(Species).filter(Species.common_name.ilike(f"%{clean_name}%")).first()
        if sp:
            species_id = sp.id

    obs_uid = f"OBS-IMG-{uuid.uuid4().hex[:8].upper()}"
    obs = Observation(
        observation_id=obs_uid,
        survey_id=save_in.survey_id,
        species_id=species_id,
        device_id=save_in.device_id,
        observation_type="image",
        observation_date=datetime.utcnow(),
        latitude=save_in.latitude or (survey.monitoring_site.latitude if survey.monitoring_site else None),
        longitude=save_in.longitude or (survey.monitoring_site.longitude if survey.monitoring_site else None),
        count=save_in.count or 1,
        confidence_score=save_in.confidence_score,
        behavior_observed=save_in.behavior_observed or "Alert",
        notes=save_in.notes or "Detected via YOLOv8 Wildlife Engine",
        file_path=save_in.file_path,
        created_by_id=current_user.id
    )
    db.add(obs)
    db.commit()
    db.refresh(obs)

    # Save details in ImageAnalysis record
    img_data = save_in.analysis_data or {}
    img_analysis = ImageAnalysis(
        observation_id=obs.id,
        detected_species=save_in.species_name,
        confidence=save_in.confidence_score,
        animal_count=save_in.count,
        image_quality=img_data.get("image_quality", "good"),
        bounding_boxes=img_data.get("detections", []),
        behavior_detected=save_in.behavior_observed,
        model_version=img_data.get("model_version", "YOLOv8x-Wildlife")
    )
    db.add(img_analysis)
    db.commit()

    sp = db.query(Species).filter(Species.id == obs.species_id).first() if obs.species_id else None

    return ObservationResponse(
        id=obs.id,
        observation_id=obs.observation_id,
        survey_id=obs.survey_id,
        species_id=obs.species_id,
        device_id=obs.device_id,
        observation_type=obs.observation_type,
        observation_date=obs.observation_date,
        latitude=obs.latitude,
        longitude=obs.longitude,
        count=obs.count,
        confidence_score=obs.confidence_score,
        behavior_observed=obs.behavior_observed,
        notes=obs.notes,
        file_path=obs.file_path,
        created_by_id=obs.created_by_id,
        created_at=obs.created_at,
        species_name=sp.common_name if sp else (save_in.species_name or "Wild Animal"),
        scientific_name=sp.scientific_name if sp else None,
        species_group=sp.species_group if sp else "Mammal",
        is_endangered=sp.is_endangered if sp else False,
        site_name=survey.monitoring_site.site_name if survey.monitoring_site else None
    )
