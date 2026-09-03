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
from app.schemas.observation import MediaAssetOut, ImageAnalysisResult, SpeciesObservationOut
from app.services.image_analysis import analyze_image
from app.services.live_feed import broadcast_detection

router = APIRouter(prefix="/api/v1/images", tags=["Wildlife Image Analysis Engine"])

ALLOWED_IMAGE_EXTENSIONS = {".jpg", ".jpeg", ".png", ".bmp", ".tiff"}


@router.post("/upload", response_model=ImageAnalysisResult, status_code=201)
async def upload_and_analyze_image(
    monitoring_site_id: str = Form(...),
    survey_id: str | None = Form(None),
    file: UploadFile = File(...),
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user),
):
    """
    Camera trap / drone image upload endpoint.
    Runs the Image Analysis Engine synchronously and persists detections.
    """
    ext = os.path.splitext(file.filename)[1].lower()
    if ext not in ALLOWED_IMAGE_EXTENSIONS:
        raise HTTPException(status_code=400, detail=f"Unsupported image type: {ext}")

    site = db.query(MonitoringSite).filter(MonitoringSite.id == monitoring_site_id).first()
    if not site:
        raise HTTPException(status_code=404, detail="Monitoring site not found.")

    # Save file to disk
    images_dir = os.path.join(settings.UPLOAD_DIR, "images")
    os.makedirs(images_dir, exist_ok=True)
    stored_filename = f"{uuid.uuid4()}{ext}"
    stored_path = os.path.join(images_dir, stored_filename)

    contents = await file.read()
    with open(stored_path, "wb") as f:
        f.write(contents)

    # Run the Image Analysis Engine (species classification, animal detection,
    # quality assessment, animal counting)
    result = analyze_image(stored_path)

    media_asset = MediaAsset(
        survey_id=survey_id,
        monitoring_site_id=monitoring_site_id,
        source_type=SourceType.IMAGE,
        file_path=stored_path,
        original_filename=file.filename,
        uploaded_by=current_user.id,
        quality_score=result["quality_score"],
        processed="processed",
    )
    db.add(media_asset)
    db.flush()  # get media_asset.id before commit

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
            bounding_box=det.bounding_box,
            behavior=det.behavior,
        )
        db.add(obs)
        observations.append(obs)

    db.commit()
    db.refresh(media_asset)
    for obs in observations:
        db.refresh(obs)

    # Push each detection to the Live Wildlife Monitoring Map (Milestone 4).
    # Best-effort: a broadcast failure should never fail the upload itself.
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
                source_type="image",
                detected_at=obs.detected_at.isoformat(),
            )
        except Exception:
            pass

    return ImageAnalysisResult(
        media_asset=media_asset,
        detections=observations,
        quality_score=result["quality_score"],
        processing_time_ms=result["processing_time_ms"],
    )


@router.get("/", response_model=List[MediaAssetOut])
def list_images(db: Session = Depends(get_db), _: User = Depends(get_current_user)):
    return db.query(MediaAsset).filter(MediaAsset.source_type == SourceType.IMAGE).order_by(
        MediaAsset.uploaded_at.desc()
    ).all()


@router.get("/{media_asset_id}/detections", response_model=List[SpeciesObservationOut])
def get_image_detections(media_asset_id: str, db: Session = Depends(get_db), _: User = Depends(get_current_user)):
    return db.query(SpeciesObservation).filter(SpeciesObservation.media_asset_id == media_asset_id).all()
