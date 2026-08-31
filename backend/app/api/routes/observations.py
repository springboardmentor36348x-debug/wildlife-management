from fastapi import APIRouter, Depends, HTTPException
from sqlalchemy.orm import Session
from app.database import get_db
from app.models.observation import Observation
from app.models.monitoring_site import MonitoringSite
from app.models.survey import Survey
from app.schemas.observation import ObservationCreate, ObservationResponse
from app.models.user import User
from app.core.permissions import require_role
from app.api.deps import get_current_user
router = APIRouter(prefix="/observations", tags=["Observation Logging"])


# ✅ CREATE
@router.post("/", response_model=ObservationResponse)
def create_observation(
    observation_data: ObservationCreate,
    db: Session = Depends(get_db),
    current_user: User = Depends(require_role(["wildlife_researcher", "administrator"]))
):
    site = db.query(MonitoringSite).filter(
        MonitoringSite.id == observation_data.monitoring_site_id
    ).first()

    if not site:
        raise HTTPException(status_code=404, detail="Monitoring site not found")

    survey = db.query(Survey).filter(Survey.id == site.survey_id).first()

    if current_user.role != "administrator" and survey.created_by != current_user.id:
        raise HTTPException(status_code=403, detail="Not authorized")

    new_observation = Observation(
        **observation_data.dict(),
        recorded_by=current_user.id
    )

    db.add(new_observation)
    db.commit()
    db.refresh(new_observation)

    return new_observation


# ✅ LIST
@router.get("/", response_model=list[ObservationResponse])
def list_observations(
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user)
):
    if current_user.role in ["administrator", "conservation_officer", "forest_officer"]:
        return db.query(Observation).all()

    return db.query(Observation).join(
        MonitoringSite, Observation.monitoring_site_id == MonitoringSite.id
    ).join(
        Survey, MonitoringSite.survey_id == Survey.id
    ).filter(
        Survey.created_by == current_user.id
    ).all()