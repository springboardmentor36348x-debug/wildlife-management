from fastapi import APIRouter, Depends, HTTPException
from sqlalchemy.orm import Session
from app.database import get_db
from app.models.camera_trap import CameraTrap
from app.models.monitoring_site import MonitoringSite
from app.models.survey import Survey
from app.schemas.camera_trap import CameraTrapCreate, CameraTrapResponse
from app.models.user import User
from app.core.permissions import require_role
from app.api.deps import get_current_user
router = APIRouter(prefix="/camera-traps", tags=["Camera Trap Management"])


# ✅ CREATE
@router.post("/", response_model=CameraTrapResponse)
def create_camera_trap(
    trap_data: CameraTrapCreate,
    db: Session = Depends(get_db),
    current_user: User = Depends(require_role(["wildlife_researcher", "administrator"]))
):
    site = db.query(MonitoringSite).filter(
        MonitoringSite.id == trap_data.monitoring_site_id
    ).first()

    if not site:
        raise HTTPException(status_code=404, detail="Monitoring site not found")

    survey = db.query(Survey).filter(Survey.id == site.survey_id).first()

    if current_user.role != "administrator" and survey.created_by != current_user.id:
        raise HTTPException(status_code=403, detail="Not authorized")

    new_trap = CameraTrap(**trap_data.dict())

    db.add(new_trap)
    db.commit()
    db.refresh(new_trap)

    return new_trap


# ✅ LIST
@router.get("/", response_model=list[CameraTrapResponse])
def list_camera_traps(
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user)
):
    if current_user.role in ["administrator", "conservation_officer", "forest_officer"]:
        return db.query(CameraTrap).all()

    return db.query(CameraTrap).join(
        MonitoringSite, CameraTrap.monitoring_site_id == MonitoringSite.id
    ).join(
        Survey, MonitoringSite.survey_id == Survey.id
    ).filter(
        Survey.created_by == current_user.id
    ).all()