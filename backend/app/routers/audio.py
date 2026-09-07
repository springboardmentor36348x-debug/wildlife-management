import os
import uuid
from typing import List

from fastapi import APIRouter, Depends, HTTPException, UploadFile, File, Form
from sqlalchemy.orm import Session

from app.auth.dependencies import get_current_user
from app.config import settings
from app.database import get_db
from app.models.user import User
from app.models.survey import MonitoringSite
from app.models.observation import MediaAsset, SpeciesObservation, SourceType
from app.schemas.observation import MediaAssetOut, AudioAnalysisResult
from app.services.bioacoustic_engine import analyze_audio
from app.services.live_feed import broadcast_detection

router = APIRouter(prefix="/api/v1/audio", tags=["Bioacoustic Recognition Engine"])

ALLOWED_AUDIO_EXTENSIONS = {".wav", ".mp3", ".flac", ".ogg", ".m4a"}


@router.post("/upload", response_model=AudioAnalysisResult, status_code=201)
async def upload_and_analyze_audio(
    monitoring_site_id: str = Form(...),
    survey_id: str | None = Form(None),
    file: UploadFile = File(...),
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user),
):
    """
    Wildlife audio recording upload endpoint.
    Runs the Bioacoustic Recognition Engine (animal call / bird song
    detection, species classification, acoustic event detection).
    """
    ext = os.path.splitext(file.filename)[1].lower()
    if ext not in ALLOWED_AUDIO_EXTENSIONS:
        raise HTTPException(status_code=400, detail=f"Unsupported audio type: {ext}")

    site = db.query(MonitoringSite).filter(MonitoringSite.id == monitoring_site_id).first()
    if not site:
        raise HTTPException(status_code=404, detail="Monitoring site not found.")

    audio_dir = os.path.join(settings.UPLOAD_DIR, "audio")
    os.makedirs(audio_dir, exist_ok=True)
    stored_filename = f"{uuid.uuid4()}{ext}"
    stored_path = os.path.join(audio_dir, stored_filename)

    contents = await file.read()
    with open(stored_path, "wb") as f:
        f.write(contents)

    result = analyze_audio(stored_path)

    media_asset = MediaAsset(
        survey_id=survey_id,
        monitoring_site_id=monitoring_site_id,
        source_type=SourceType.AUDIO,
        file_path=stored_path,
        original_filename=file.filename,
        uploaded_by=current_user.id,
        processed="processed",
    )
    db.add(media_asset)
    db.flush()

    observations = []
    for det in result["detections"]:
        obs = SpeciesObservation(
            survey_id=survey_id,
            media_asset_id=media_asset.id,
            species_common_name=det.species_common_name,
            species_scientific_name=det.species_scientific_name,
            species_group=det.species_group,
            conservation_status=det.conservation_status,
            confidence_score=det.confidence_score,
            individual_count=det.individual_count,
            acoustic_event_type=det.acoustic_event_type,
        )
        db.add(obs)
        observations.append(obs)

    db.commit()
    db.refresh(media_asset)
    for obs in observations:
        db.refresh(obs)

    # Push each detection to the Live Wildlife Monitoring Map (Milestone 4).
    for obs in observations:
        try:
            await broadcast_detection(
                monitoring_site_id=str(site.id),
                site_name=site.name,
                latitude=site.latitude,
                longitude=site.longitude,
                species_common_name=obs.species_common_name,
                conservation_status=obs.conservation_status.value,
                confidence_score=obs.confidence_score,
                source_type="audio",
                detected_at=obs.detected_at.isoformat(),
            )
        except Exception:
            pass

    return AudioAnalysisResult(
        media_asset=media_asset,
        detections=observations,
        processing_time_ms=result["processing_time_ms"],
    )


@router.get("/", response_model=List[MediaAssetOut])
def list_audio(db: Session = Depends(get_db), _: User = Depends(get_current_user)):
    return db.query(MediaAsset).filter(MediaAsset.source_type == SourceType.AUDIO).order_by(
        MediaAsset.uploaded_at.desc()
    ).all()
