from typing import List

from fastapi import APIRouter, Depends, HTTPException
from sqlalchemy.orm import Session

from app.auth.dependencies import get_current_user
from app.database import get_db
from app.models.user import User
from app.models.survey import Survey, MonitoringSite
from app.schemas.survey import SurveyCreate, SurveyOut

router = APIRouter(prefix="/api/v1/surveys", tags=["Surveys"])


@router.post("/", response_model=SurveyOut, status_code=201)
def create_survey(
    payload: SurveyCreate,
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user),
):
    site = db.query(MonitoringSite).filter(MonitoringSite.id == payload.monitoring_site_id).first()
    if not site:
        raise HTTPException(status_code=404, detail="Monitoring site not found.")

    survey = Survey(**payload.model_dump(), created_by=current_user.id)
    db.add(survey)
    db.commit()
    db.refresh(survey)
    return survey


@router.get("/", response_model=List[SurveyOut])
def list_surveys(db: Session = Depends(get_db), _: User = Depends(get_current_user)):
    return db.query(Survey).order_by(Survey.survey_date.desc()).all()


@router.get("/{survey_id}", response_model=SurveyOut)
def get_survey(survey_id: str, db: Session = Depends(get_db), _: User = Depends(get_current_user)):
    survey = db.query(Survey).filter(Survey.id == survey_id).first()
    if not survey:
        raise HTTPException(status_code=404, detail="Survey not found.")
    return survey
