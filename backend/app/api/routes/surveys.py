from fastapi import APIRouter, Depends, HTTPException
from sqlalchemy.orm import Session

from app.core.deps import require_roles, get_current_user
from app.db.session import get_db
from app.models.user import User, UserRole
from app.models.survey import Survey, MonitoringSite
from app.schemas.survey import (
    SurveyCreate, SurveyUpdate, SurveyOut,
    MonitoringSiteCreate, MonitoringSiteOut,
)

router = APIRouter(prefix="/surveys", tags=["Surveys & Monitoring Sites"])

# Only these roles may create/modify surveys and sites (NFR-1).
CAN_MANAGE = (UserRole.ADMINISTRATOR, UserRole.RESEARCHER, UserRole.FOREST_DEPARTMENT)


@router.post("/", response_model=SurveyOut, status_code=201)
def create_survey(
    payload: SurveyCreate,
    db: Session = Depends(get_db),
    current_user: User = Depends(require_roles(*CAN_MANAGE)),
):
    survey = Survey(**payload.model_dump(), created_by=current_user.id)
    db.add(survey)
    db.commit()
    db.refresh(survey)
    return survey


@router.get("/", response_model=list[SurveyOut])
def list_surveys(
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user),
):
    """All authenticated roles can view surveys (read-only for Officers)."""
    return db.query(Survey).order_by(Survey.created_at.desc()).all()


@router.get("/{survey_id}", response_model=SurveyOut)
def get_survey(
    survey_id: str,
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user),
):
    survey = db.query(Survey).filter(Survey.id == survey_id).first()
    if not survey:
        raise HTTPException(status_code=404, detail="Survey not found.")
    return survey


@router.patch("/{survey_id}", response_model=SurveyOut)
def update_survey(
    survey_id: str,
    payload: SurveyUpdate,
    db: Session = Depends(get_db),
    current_user: User = Depends(require_roles(*CAN_MANAGE)),
):
    survey = db.query(Survey).filter(Survey.id == survey_id).first()
    if not survey:
        raise HTTPException(status_code=404, detail="Survey not found.")
    for field, value in payload.model_dump(exclude_unset=True).items():
        setattr(survey, field, value)
    db.commit()
    db.refresh(survey)
    return survey


@router.delete("/{survey_id}", status_code=204)
def delete_survey(
    survey_id: str,
    db: Session = Depends(get_db),
    current_user: User = Depends(require_roles(UserRole.ADMINISTRATOR)),
):
    survey = db.query(Survey).filter(Survey.id == survey_id).first()
    if not survey:
        raise HTTPException(status_code=404, detail="Survey not found.")
    db.delete(survey)
    db.commit()


# ---- Monitoring sites (nested under surveys) ----

@router.post("/sites", response_model=MonitoringSiteOut, status_code=201)
def create_monitoring_site(
    payload: MonitoringSiteCreate,
    db: Session = Depends(get_db),
    current_user: User = Depends(require_roles(*CAN_MANAGE)),
):
    survey = db.query(Survey).filter(Survey.id == payload.survey_id).first()
    if not survey:
        raise HTTPException(status_code=404, detail="Parent survey not found.")

    site = MonitoringSite(**payload.model_dump())
    db.add(site)
    db.commit()
    db.refresh(site)
    return site


@router.get("/sites/all", response_model=list[MonitoringSiteOut])
def list_all_sites(
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user),
):
    return db.query(MonitoringSite).order_by(MonitoringSite.created_at.desc()).all()


@router.get("/{survey_id}/sites", response_model=list[MonitoringSiteOut])
def list_sites_for_survey(
    survey_id: str,
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user),
):
    return db.query(MonitoringSite).filter(MonitoringSite.survey_id == survey_id).all()
