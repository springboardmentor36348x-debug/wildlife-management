"""
Observations Router
"""

from fastapi import APIRouter, Depends, HTTPException, status
from sqlalchemy.orm import Session
from typing import List, Optional
from datetime import datetime

from database import get_db
from models import Observation, Survey, Species, MonitoringSite, User
from schemas.monitoring import ObservationCreate, ObservationResponse
from security import get_current_active_user

router = APIRouter()


@router.get("/", response_model=List[ObservationResponse])
def list_observations(
    survey_id: Optional[int] = None,
    site_id: Optional[int] = None,
    species_id: Optional[int] = None,
    obs_type: Optional[str] = None,
    skip: int = 0,
    limit: int = 100,
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_active_user)
):
    """List observations with filters"""
    query = db.query(Observation)

    if survey_id:
        query = query.filter(Observation.survey_id == survey_id)
    if species_id:
        query = query.filter(Observation.species_id == species_id)
    if obs_type:
        query = query.filter(Observation.observation_type == obs_type)
    if site_id:
        query = query.join(Survey, Observation.survey_id == Survey.id)\
                     .filter(Survey.monitoring_site_id == site_id)

    observations = query.order_by(Observation.observation_date.desc()).offset(skip).limit(limit).all()

    results = []
    for o in observations:
        sp_name = o.species.common_name if o.species else "Unknown Wildlife"
        sc_name = o.species.scientific_name if o.species else None
        sp_group = o.species.species_group if o.species else "Mammal"
        is_end = o.species.is_endangered if o.species else False
        site_name = o.survey.monitoring_site.site_name if (o.survey and o.survey.monitoring_site) else None

        results.append(ObservationResponse(
            id=o.id,
            observation_id=o.observation_id,
            survey_id=o.survey_id,
            species_id=o.species_id,
            device_id=o.device_id,
            observation_type=o.observation_type,
            observation_date=o.observation_date,
            latitude=o.latitude,
            longitude=o.longitude,
            count=o.count or 1,
            confidence_score=o.confidence_score,
            behavior_observed=o.behavior_observed,
            notes=o.notes,
            file_path=o.file_path,
            created_by_id=o.created_by_id,
            created_at=o.created_at,
            species_name=sp_name,
            scientific_name=sc_name,
            species_group=sp_group,
            is_endangered=is_end,
            site_name=site_name
        ))

    return results


@router.post("/", response_model=ObservationResponse, status_code=status.HTTP_201_CREATED)
def create_observation(
    obs_in: ObservationCreate,
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_active_user)
):
    """Record an observation manually or from analysis"""
    survey = db.query(Survey).filter(Survey.id == obs_in.survey_id).first()
    if not survey:
        raise HTTPException(status_code=404, detail="Referenced survey not found")

    obs = Observation(
        observation_id=obs_in.observation_id,
        survey_id=obs_in.survey_id,
        species_id=obs_in.species_id,
        device_id=obs_in.device_id,
        observation_type=obs_in.observation_type,
        observation_date=obs_in.observation_date,
        latitude=obs_in.latitude or (survey.monitoring_site.latitude if survey.monitoring_site else None),
        longitude=obs_in.longitude or (survey.monitoring_site.longitude if survey.monitoring_site else None),
        count=obs_in.count,
        confidence_score=obs_in.confidence_score,
        behavior_observed=obs_in.behavior_observed,
        notes=obs_in.notes,
        file_path=obs_in.file_path,
        created_by_id=current_user.id
    )
    db.add(obs)
    db.commit()
    db.refresh(obs)

    sp = db.query(Species).filter(Species.id == obs.species_id).first() if obs.species_id else None

    return ObservationResponse(
        id=obs.id,
        observation_id=obs.observation_id,
        survey_id=obs.survey_id,
        species_id=obs.species_id,
        device_id=obs.device_id,
        observation_type=obs.observation_type,
        observation_date=obs.observation_date,
        latitude=obs.latitude,
        longitude=obs.longitude,
        count=obs.count,
        confidence_score=obs.confidence_score,
        behavior_observed=obs.behavior_observed,
        notes=obs.notes,
        file_path=obs.file_path,
        created_by_id=obs.created_by_id,
        created_at=obs.created_at,
        species_name=sp.common_name if sp else "Unknown Wildlife",
        scientific_name=sp.scientific_name if sp else None,
        species_group=sp.species_group if sp else "Mammal",
        is_endangered=sp.is_endangered if sp else False,
        site_name=survey.monitoring_site.site_name if survey.monitoring_site else None
    )


@router.delete("/{obs_id_pk}", status_code=status.HTTP_204_NO_CONTENT)
def delete_observation(
    obs_id_pk: int,
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_active_user)
):
    """Delete an observation"""
    obs = db.query(Observation).filter(Observation.id == obs_id_pk).first()
    if not obs:
        raise HTTPException(status_code=404, detail="Observation not found")
    db.delete(obs)
    db.commit()
    return None
