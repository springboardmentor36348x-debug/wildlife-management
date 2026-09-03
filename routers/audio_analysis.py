"""
Wildlife Bioacoustic Audio Analysis Router (Librosa / YAMNet / BirdNET)
"""

import os
import shutil
import uuid
from datetime import datetime
from fastapi import APIRouter, Depends, HTTPException, UploadFile, File, status
from sqlalchemy.orm import Session
from typing import Optional

from database import get_db
from models import Observation, AudioAnalysis, Species, Survey, User
from schemas.analysis import AudioAnalysisResult, SaveObservationFromAnalysis
from schemas.monitoring import ObservationResponse
from ai.audio_classifier import audio_analyzer
from security import get_current_active_user

router = APIRouter()

AUDIO_UPLOAD_DIR = os.path.join("uploads", "audio")
SPECTROGRAM_DIR = os.path.join("uploads", "spectrograms")
os.makedirs(AUDIO_UPLOAD_DIR, exist_ok=True)
os.makedirs(SPECTROGRAM_DIR, exist_ok=True)


@router.post("/analyze", response_model=AudioAnalysisResult)
async def analyze_wildlife_audio(
    file: UploadFile = File(...),
    current_user: User = Depends(get_current_active_user)
):
    """
    Upload bioacoustic audio recording (WAV, MP3, FLAC, M4A).
    Extracts acoustic features, generates visual Mel-spectrogram, and identifies animal/bird vocalization.
    """
    if not file.filename.lower().endswith(('.wav', '.mp3', '.m4a', '.flac', '.ogg')):
        raise HTTPException(
            status_code=400,
            detail="Invalid audio format. Allowed formats: WAV, MP3, FLAC, M4A, OGG"
        )

    unique_filename = f"{uuid.uuid4().hex[:10]}_{file.filename}"
    saved_path = os.path.join(AUDIO_UPLOAD_DIR, unique_filename)

    with open(saved_path, "wb") as buffer:
        shutil.copyfileobj(file.file, buffer)

    analysis_result = audio_analyzer.analyze_audio(saved_path, file.filename, SPECTROGRAM_DIR)
    analysis_result["file_path"] = f"/uploads/audio/{unique_filename}"

    return analysis_result


@router.post("/save-observation", response_model=ObservationResponse)
def save_observation_from_audio(
    save_in: SaveObservationFromAnalysis,
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_active_user)
):
    """Save verified bioacoustic observation into database"""
    survey = db.query(Survey).filter(Survey.id == save_in.survey_id).first()
    if not survey:
        raise HTTPException(status_code=404, detail="Referenced survey not found")

    species_id = save_in.species_id
    if not species_id and save_in.species_name:
        clean_name = save_in.species_name.split("(")[0].strip()
        sp = db.query(Species).filter(Species.common_name.ilike(f"%{clean_name}%")).first()
        if sp:
            species_id = sp.id

    obs_uid = f"OBS-AUD-{uuid.uuid4().hex[:8].upper()}"
    obs = Observation(
        observation_id=obs_uid,
        survey_id=save_in.survey_id,
        species_id=species_id,
        device_id=save_in.device_id,
        observation_type="audio",
        observation_date=datetime.utcnow(),
        latitude=save_in.latitude or (survey.monitoring_site.latitude if survey.monitoring_site else None),
        longitude=save_in.longitude or (survey.monitoring_site.longitude if survey.monitoring_site else None),
        count=save_in.count or 1,
        confidence_score=save_in.confidence_score,
        behavior_observed=save_in.behavior_observed or "Bioacoustic Vocalization",
        notes=save_in.notes or "Identified via Bioacoustic Audio Intelligence Engine",
        file_path=save_in.file_path,
        created_by_id=current_user.id
    )
    db.add(obs)
    db.commit()
    db.refresh(obs)

    aud_data = save_in.analysis_data or {}
    audio_analysis = AudioAnalysis(
        observation_id=obs.id,
        detected_species=save_in.species_name,
        confidence=save_in.confidence_score,
        call_type=aud_data.get("call_type", "Territorial Call"),
        frequency_range=aud_data.get("frequency_range", "1 kHz - 5 kHz"),
        noise_level=aud_data.get("noise_level", 0.15),
        model_version=aud_data.get("model_version", "BirdNET-Bioacoustic"),
        spectrogram_path=aud_data.get("spectrogram_url")
    )
    db.add(audio_analysis)
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
        species_group=sp.species_group if sp else "Bird",
        is_endangered=sp.is_endangered if sp else False,
        site_name=survey.monitoring_site.site_name if survey.monitoring_site else None
    )
