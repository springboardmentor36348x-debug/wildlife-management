from typing import List

from fastapi import APIRouter, Depends, HTTPException
from sqlalchemy.orm import Session

from app.auth.dependencies import get_current_user
from app.database import get_db
from app.models.user import User
from app.models.survey import MonitoringSite
from app.models.observation import SpeciesObservation, MediaAsset
from app.models.biodiversity import BiodiversityAssessment
from app.models.habitat import HabitatAssessment
from app.schemas.biodiversity import BiodiversityAssessmentOut
from app.services.biodiversity_engine import compute_biodiversity_assessment

router = APIRouter(prefix="/api/v1/biodiversity", tags=["Biodiversity Intelligence Engine"])


@router.post("/assess/{monitoring_site_id}", response_model=BiodiversityAssessmentOut, status_code=201)
def run_biodiversity_assessment(
    monitoring_site_id: str,
    db: Session = Depends(get_db),
    _: User = Depends(get_current_user),
):
    """
    Computes a fresh biodiversity / ecosystem-health snapshot for a site from
    all species observations recorded there (image + audio detections).
    Pulls habitat_quality_score from the Habitat Intelligence Engine
    (Milestone 3) if a habitat assessment exists for this site; otherwise
    falls back to the neutral default (see biodiversity_engine.py docstring).
    """
    site = db.query(MonitoringSite).filter(MonitoringSite.id == monitoring_site_id).first()
    if not site:
        raise HTTPException(status_code=404, detail="Monitoring site not found.")

    observations = (
        db.query(SpeciesObservation)
        .join(MediaAsset)
        .filter(MediaAsset.monitoring_site_id == monitoring_site_id)
        .all()
    )

    latest_habitat = (
        db.query(HabitatAssessment)
        .filter(HabitatAssessment.monitoring_site_id == monitoring_site_id)
        .order_by(HabitatAssessment.assessed_at.desc())
        .first()
    )

    if latest_habitat is not None:
        result = compute_biodiversity_assessment(
            observations, habitat_quality_score=latest_habitat.habitat_quality_score
        )
    else:
        result = compute_biodiversity_assessment(observations)

    assessment = BiodiversityAssessment(monitoring_site_id=monitoring_site_id, **result)
    db.add(assessment)
    db.commit()
    db.refresh(assessment)
    return assessment


@router.get("/{monitoring_site_id}/history", response_model=List[BiodiversityAssessmentOut])
def biodiversity_history(
    monitoring_site_id: str,
    db: Session = Depends(get_db),
    _: User = Depends(get_current_user),
):
    """Population/biodiversity trend analysis - historical assessments for a site."""
    return (
        db.query(BiodiversityAssessment)
        .filter(BiodiversityAssessment.monitoring_site_id == monitoring_site_id)
        .order_by(BiodiversityAssessment.assessed_at.desc())
        .all()
    )


@router.get("/{monitoring_site_id}/latest", response_model=BiodiversityAssessmentOut)
def latest_biodiversity_assessment(
    monitoring_site_id: str,
    db: Session = Depends(get_db),
    _: User = Depends(get_current_user),
):
    assessment = (
        db.query(BiodiversityAssessment)
        .filter(BiodiversityAssessment.monitoring_site_id == monitoring_site_id)
        .order_by(BiodiversityAssessment.assessed_at.desc())
        .first()
    )
    if not assessment:
        raise HTTPException(status_code=404, detail="No biodiversity assessment found for this site yet.")
    return assessment
