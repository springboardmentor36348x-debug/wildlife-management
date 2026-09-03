from typing import List

from fastapi import APIRouter, Depends, HTTPException
from sqlalchemy.orm import Session

from app.auth.dependencies import get_current_user
from app.database import get_db
from app.models.user import User
from app.models.survey import MonitoringSite
from app.models.biodiversity import BiodiversityAssessment
from app.models.habitat import HabitatAssessment
from app.schemas.habitat import HabitatAssessmentOut
from app.services.habitat_engine import assess_habitat

router = APIRouter(prefix="/api/v1/habitat", tags=["Habitat Intelligence Engine"])


@router.post("/assess/{monitoring_site_id}", response_model=HabitatAssessmentOut, status_code=201)
def run_habitat_assessment(
    monitoring_site_id: str,
    db: Session = Depends(get_db),
    _: User = Depends(get_current_user),
):
    """
    Computes a fresh habitat assessment for a site. See habitat_engine.py
    module docstring for the honest limitations (this is a proxy-based
    placeholder pending real satellite/NDVI integration, not live remote
    sensing analysis).
    """
    site = db.query(MonitoringSite).filter(MonitoringSite.id == monitoring_site_id).first()
    if not site:
        raise HTTPException(status_code=404, detail="Monitoring site not found.")

    recent_assessments = (
        db.query(BiodiversityAssessment)
        .filter(BiodiversityAssessment.monitoring_site_id == monitoring_site_id)
        .order_by(BiodiversityAssessment.assessed_at.desc())
        .limit(5)
        .all()
    )

    result = assess_habitat(site.habitat_type, recent_assessments)

    assessment = HabitatAssessment(monitoring_site_id=monitoring_site_id, **result)
    db.add(assessment)
    db.commit()
    db.refresh(assessment)
    return assessment


@router.get("/{monitoring_site_id}/latest", response_model=HabitatAssessmentOut)
def latest_habitat_assessment(
    monitoring_site_id: str,
    db: Session = Depends(get_db),
    _: User = Depends(get_current_user),
):
    assessment = (
        db.query(HabitatAssessment)
        .filter(HabitatAssessment.monitoring_site_id == monitoring_site_id)
        .order_by(HabitatAssessment.assessed_at.desc())
        .first()
    )
    if not assessment:
        raise HTTPException(status_code=404, detail="No habitat assessment found for this site yet.")
    return assessment


@router.get("/{monitoring_site_id}/history", response_model=List[HabitatAssessmentOut])
def habitat_history(
    monitoring_site_id: str,
    db: Session = Depends(get_db),
    _: User = Depends(get_current_user),
):
    return (
        db.query(HabitatAssessment)
        .filter(HabitatAssessment.monitoring_site_id == monitoring_site_id)
        .order_by(HabitatAssessment.assessed_at.desc())
        .all()
    )
