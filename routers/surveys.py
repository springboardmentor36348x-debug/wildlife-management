"""
Surveys Router
"""

from fastapi import APIRouter, Depends, HTTPException, status
from sqlalchemy.orm import Session
from sqlalchemy import func
from typing import List, Optional

from database import get_db
from models import Survey, MonitoringSite, Observation, User
from schemas.monitoring import SurveyCreate, SurveyUpdate, SurveyResponse
from security import get_current_active_user

router = APIRouter()


@router.get("/", response_model=List[SurveyResponse])
def list_surveys(
    site_id: Optional[int] = None,
    skip: int = 0,
    limit: int = 100,
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_active_user)
):
    """List surveys, optionally filtered by site"""
    query = db.query(Survey).filter(Survey.is_active == True)
    if site_id:
        query = query.filter(Survey.monitoring_site_id == site_id)
    
    surveys = query.order_by(Survey.survey_date.desc()).offset(skip).limit(limit).all()

    results = []
    for s in surveys:
        site_name = s.monitoring_site.site_name if s.monitoring_site else "Unknown Site"
        obs_cnt = db.query(func.count(Observation.id)).filter(Observation.survey_id == s.id).scalar() or 0
        results.append(SurveyResponse(
            id=s.id,
            survey_id=s.survey_id,
            survey_name=s.survey_name,
            monitoring_site_id=s.monitoring_site_id,
            created_by_id=s.created_by_id,
            survey_date=s.survey_date,
            survey_duration_hours=s.survey_duration_hours,
            weather_conditions=s.weather_conditions,
            notes=s.notes,
            is_active=s.is_active,
            created_at=s.created_at,
            monitoring_site_name=site_name,
            observation_count=obs_cnt
        ))

    return results


@router.post("/", response_model=SurveyResponse, status_code=status.HTTP_201_CREATED)
def create_survey(
    survey_in: SurveyCreate,
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_active_user)
):
    """Create a new survey event"""
    existing = db.query(Survey).filter(Survey.survey_id == survey_in.survey_id).first()
    if existing:
        raise HTTPException(
            status_code=400,
            detail=f"Survey with ID '{survey_in.survey_id}' already exists"
        )

    site = db.query(MonitoringSite).filter(MonitoringSite.id == survey_in.monitoring_site_id).first()
    if not site:
        raise HTTPException(status_code=404, detail="Selected monitoring site not found")

    survey = Survey(
        survey_id=survey_in.survey_id,
        survey_name=survey_in.survey_name,
        monitoring_site_id=survey_in.monitoring_site_id,
        created_by_id=current_user.id,
        survey_date=survey_in.survey_date,
        survey_duration_hours=survey_in.survey_duration_hours,
        weather_conditions=survey_in.weather_conditions,
        notes=survey_in.notes,
        is_active=True
    )
    db.add(survey)
    db.commit()
    db.refresh(survey)

    return SurveyResponse(
        id=survey.id,
        survey_id=survey.survey_id,
        survey_name=survey.survey_name,
        monitoring_site_id=survey.monitoring_site_id,
        created_by_id=survey.created_by_id,
        survey_date=survey.survey_date,
        survey_duration_hours=survey.survey_duration_hours,
        weather_conditions=survey.weather_conditions,
        notes=survey.notes,
        is_active=survey.is_active,
        created_at=survey.created_at,
        monitoring_site_name=site.site_name,
        observation_count=0
    )


@router.get("/{survey_id_pk}", response_model=SurveyResponse)
def get_survey(
    survey_id_pk: int,
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_active_user)
):
    """Retrieve single survey by primary key"""
    s = db.query(Survey).filter(Survey.id == survey_id_pk).first()
    if not s:
        raise HTTPException(status_code=404, detail="Survey not found")

    site_name = s.monitoring_site.site_name if s.monitoring_site else "Unknown Site"
    obs_cnt = db.query(func.count(Observation.id)).filter(Observation.survey_id == s.id).scalar() or 0

    return SurveyResponse(
        id=s.id,
        survey_id=s.survey_id,
        survey_name=s.survey_name,
        monitoring_site_id=s.monitoring_site_id,
        created_by_id=s.created_by_id,
        survey_date=s.survey_date,
        survey_duration_hours=s.survey_duration_hours,
        weather_conditions=s.weather_conditions,
        notes=s.notes,
        is_active=s.is_active,
        created_at=s.created_at,
        monitoring_site_name=site_name,
        observation_count=obs_cnt
    )


@router.delete("/{survey_id_pk}", status_code=status.HTTP_204_NO_CONTENT)
def delete_survey(
    survey_id_pk: int,
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_active_user)
):
    """Deactivate survey"""
    s = db.query(Survey).filter(Survey.id == survey_id_pk).first()
    if not s:
        raise HTTPException(status_code=404, detail="Survey not found")
    
    s.is_active = False
    db.commit()
    return None
