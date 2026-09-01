from fastapi import APIRouter, Depends, HTTPException
from sqlalchemy.orm import Session

from app.core.deps import get_current_user
from app.db.session import get_db
from app.models.user import User
from app.models.survey import MonitoringSite
from app.services import habitat_service

router = APIRouter(prefix="/habitat", tags=["Habitat Intelligence"])


def _get_site_or_404(db: Session, site_id: str) -> MonitoringSite:
    site = db.query(MonitoringSite).filter(MonitoringSite.id == site_id).first()
    if not site:
        raise HTTPException(status_code=404, detail="Monitoring site not found.")
    return site


@router.get("/sites/{site_id}/classification")
def habitat_classification(
    site_id: str,
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user),
):
    site = _get_site_or_404(db, site_id)
    return {"site_id": site_id, "habitat_type": habitat_service.classify_habitat(site)}


@router.get("/sites/{site_id}/degradation")
def habitat_degradation(
    site_id: str,
    window_days: int = 90,
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user),
):
    _get_site_or_404(db, site_id)
    return habitat_service.detect_habitat_degradation(db, site_id=site_id, window_days=window_days)


@router.get("/sites/{site_id}/vegetation")
def habitat_vegetation(
    site_id: str,
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user),
):
    site = _get_site_or_404(db, site_id)
    return habitat_service.analyze_vegetation(site)


@router.get("/sites/{site_id}/environmental")
def habitat_environmental(
    site_id: str,
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user),
):
    site = _get_site_or_404(db, site_id)
    return habitat_service.monitor_environmental_conditions(site)


@router.get("/sites/{site_id}/suitability")
def habitat_suitability(
    site_id: str,
    species: str,
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user),
):
    _get_site_or_404(db, site_id)
    return habitat_service.predict_habitat_suitability(db, site_id=site_id, species_label=species)
