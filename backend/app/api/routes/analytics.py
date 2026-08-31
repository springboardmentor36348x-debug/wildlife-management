from fastapi import APIRouter, Depends
from sqlalchemy.orm import Session
from sqlalchemy import func, cast, Date
from app.database import get_db
from app.api.deps import get_current_user
from app.models.user import User
from app.models.survey import Survey
from app.models.monitoring_site import MonitoringSite
from app.models.observation import Observation

router = APIRouter(prefix="/analytics", tags=["Analytics"])


# ✅ OVERVIEW
@router.get("/overview")
def analytics_overview(
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user)
):

    # ✅ Researcher → own data only
    if current_user.role == "wildlife_researcher":

        total_surveys = db.query(Survey).filter(
            Survey.created_by == current_user.id
        ).count()

        total_sites = db.query(MonitoringSite).join(
            Survey, MonitoringSite.survey_id == Survey.id
        ).filter(
            Survey.created_by == current_user.id
        ).count()

        total_observations = db.query(Observation).join(
            MonitoringSite, Observation.monitoring_site_id == MonitoringSite.id
        ).join(
            Survey, MonitoringSite.survey_id == Survey.id
        ).filter(
            Survey.created_by == current_user.id
        ).count()

    # ✅ Admin + Conservation Officer + Forest Officer → all data
    else:
        total_surveys = db.query(Survey).count()
        total_sites = db.query(MonitoringSite).count()
        total_observations = db.query(Observation).count()

    return {
        "total_surveys": total_surveys,
        "total_monitoring_sites": total_sites,
        "total_observations": total_observations
    }


# ✅ SPECIES TREND
@router.get("/species-trend")
def species_trend(
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user)
):

    query = db.query(
        Observation.species_name,
        func.count(Observation.id).label("observation_count")
    )

    # ✅ Researcher → own data only
    if current_user.role == "wildlife_researcher":
        query = query.join(
            MonitoringSite, Observation.monitoring_site_id == MonitoringSite.id
        ).join(
            Survey, MonitoringSite.survey_id == Survey.id
        ).filter(
            Survey.created_by == current_user.id
        )

    results = query.group_by(Observation.species_name).all()

    return [
        {
            "species_name": r.species_name,
            "observation_count": r.observation_count
        }
        for r in results
    ]


# ✅ OBSERVATION TREND
@router.get("/observation-trend")
def observation_trend(
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user)
):

    query = db.query(
        cast(Observation.observed_at, Date).label("date"),
        func.count(Observation.id).label("count")
    )

    # ✅ Researcher → own data only
    if current_user.role == "wildlife_researcher":
        query = query.join(
            MonitoringSite, Observation.monitoring_site_id == MonitoringSite.id
        ).join(
            Survey, MonitoringSite.survey_id == Survey.id
        ).filter(
            Survey.created_by == current_user.id
        )

    results = query.group_by(
        cast(Observation.observed_at, Date)
    ).order_by(
        cast(Observation.observed_at, Date)
    ).all()

    return [
        {
            "date": str(r.date),
            "observation_count": r.count
        }
        for r in results
    ]