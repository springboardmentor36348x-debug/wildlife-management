from typing import Optional

from fastapi import APIRouter, Depends
from sqlalchemy.orm import Session

from app.database import get_db
from app.api.deps import get_current_user
from app.models.user import User
from app.models.survey import Survey
from app.models.monitoring_site import MonitoringSite
from app.models.observation import Observation
from app.models.species_prediction import SpeciesPrediction
from app.models.audio_prediction import AudioPrediction
from app.services.biodiversity_service import calculate_biodiversity_index

router = APIRouter(prefix="/reports", tags=["Reports"])


@router.get("/monitoring-summary")
def monitoring_summary(
    monitoring_site_id: Optional[str] = None,
    survey_id: Optional[str] = None,
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user),
):
    obs_query = db.query(Observation)

    # Wildlife Researcher → scope to their own surveys only (matches
    # analytics_overview's existing scoping pattern). Admin/Conservation
    # Officer/Forest Officer keep the full system-wide view.
    if current_user.role == "wildlife_researcher":
        obs_query = obs_query.join(
            MonitoringSite, Observation.monitoring_site_id == MonitoringSite.id
        ).join(
            Survey, MonitoringSite.survey_id == Survey.id
        ).filter(
            Survey.created_by == current_user.id
        )

    if monitoring_site_id:
        obs_query = obs_query.filter(Observation.monitoring_site_id == monitoring_site_id)

    total_observations = obs_query.count()

    biodiversity = calculate_biodiversity_index(
        db, monitoring_site_id, survey_id,
        researcher_id=current_user.id if current_user.role == "wildlife_researcher" else None,
    )

    image_query = db.query(SpeciesPrediction)
    audio_query = db.query(AudioPrediction)

    if current_user.role == "wildlife_researcher":
        image_query = image_query.filter(SpeciesPrediction.created_by == current_user.id)
        audio_query = audio_query.filter(AudioPrediction.created_by == current_user.id)

    recent_images = image_query.order_by(SpeciesPrediction.created_at.desc()).limit(5).all()
    recent_audio = audio_query.order_by(AudioPrediction.created_at.desc()).limit(5).all()

    return {
        "total_observations": total_observations,
        "biodiversity": biodiversity,
        "recent_image_detections": [
            {
                "species": p.predicted_species,
                "confidence": round(p.confidence, 3),
                "is_endangered": p.is_endangered,
                "detected_at": p.created_at,
            }
            for p in recent_images
        ],
        "recent_audio_detections": [
            {
                "species": p.predicted_species,
                "confidence": round(p.confidence, 3),
                "call_type": p.call_type,
                "is_endangered": p.is_endangered,
                "detected_at": p.created_at,
            }
            for p in recent_audio
        ],
    }

