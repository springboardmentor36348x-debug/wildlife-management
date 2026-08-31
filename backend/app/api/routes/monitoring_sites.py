from fastapi import APIRouter, Depends, HTTPException
from sqlalchemy.orm import Session
from app.database import get_db
from app.models.monitoring_site import MonitoringSite
from app.models.survey import Survey
from app.schemas.monitoring_site import MonitoringSiteCreate, MonitoringSiteResponse, MonitoringSiteUpdate
from app.api.deps import get_current_user
from app.models.user import User
from app.core.permissions import require_role

router = APIRouter(prefix="/monitoring-sites", tags=["Monitoring Site Management"])


# ✅ CREATE (Researcher + Forest Officer + Admin)
@router.post("/", response_model=MonitoringSiteResponse)
def create_monitoring_site(
    site_data: MonitoringSiteCreate,
    db: Session = Depends(get_db),
    current_user: User = Depends(require_role(["wildlife_researcher", "administrator", "forest_officer"]))
):
    survey = db.query(Survey).filter(Survey.id == site_data.survey_id).first()

    if not survey:
        raise HTTPException(status_code=404, detail="Survey not found")

    if current_user.role not in ["administrator", "forest_officer"] and survey.created_by != current_user.id:
        raise HTTPException(status_code=403, detail="Not authorized")

    new_site = MonitoringSite(**site_data.dict())

    db.add(new_site)
    db.commit()
    db.refresh(new_site)

    return new_site


# ✅ LIST (Role-based viewing)
@router.get("/", response_model=list[MonitoringSiteResponse])
def list_monitoring_sites(
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user)
):
    if current_user.role in ["administrator", "conservation_officer", "forest_officer"]:
        return db.query(MonitoringSite).all()

    return db.query(MonitoringSite).join(
        Survey, MonitoringSite.survey_id == Survey.id
    ).filter(
        Survey.created_by == current_user.id
    ).all()


# ✅ UPDATE (Researcher who owns it, Forest Officer, or Admin)
@router.put("/{site_id}", response_model=MonitoringSiteResponse)
def update_monitoring_site(
    site_id: str,
    site_data: MonitoringSiteUpdate,
    db: Session = Depends(get_db),
    current_user: User = Depends(require_role(["wildlife_researcher", "administrator", "forest_officer"]))
):
    site = db.query(MonitoringSite).filter(MonitoringSite.id == site_id).first()
    if not site:
        raise HTTPException(status_code=404, detail="Monitoring site not found")

    survey = db.query(Survey).filter(Survey.id == site.survey_id).first()
    if current_user.role not in ["administrator", "forest_officer"] and survey.created_by != current_user.id:
        raise HTTPException(status_code=403, detail="Not authorized")

    update_data = site_data.dict(exclude_unset=True)
    for key, value in update_data.items():
        setattr(site, key, value)

    db.commit()
    db.refresh(site)
    return site


# ✅ DELETE (Researcher who owns it, Forest Officer, or Admin)
@router.delete("/{site_id}")
def delete_monitoring_site(
    site_id: str,
    db: Session = Depends(get_db),
    current_user: User = Depends(require_role(["wildlife_researcher", "administrator", "forest_officer"]))
):
    site = db.query(MonitoringSite).filter(MonitoringSite.id == site_id).first()
    if not site:
        raise HTTPException(status_code=404, detail="Monitoring site not found")

    survey = db.query(Survey).filter(Survey.id == site.survey_id).first()
    if current_user.role not in ["administrator", "forest_officer"] and survey.created_by != current_user.id:
        raise HTTPException(status_code=403, detail="Not authorized")

    db.delete(site)
    db.commit()
    return {"detail": "Monitoring site deleted successfully"}