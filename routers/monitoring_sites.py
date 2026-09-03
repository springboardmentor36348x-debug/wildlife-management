"""
Monitoring Sites Router
"""

from fastapi import APIRouter, Depends, HTTPException, status
from sqlalchemy.orm import Session
from sqlalchemy import func
from typing import List

from database import get_db
from models import MonitoringSite, Survey, Observation, Device, HabitatAssessment, EcosystemHealth, User
from schemas.monitoring import MonitoringSiteCreate, MonitoringSiteUpdate, MonitoringSiteResponse
from security import get_current_active_user

router = APIRouter()


@router.get("", response_model=List[MonitoringSiteResponse], include_in_schema=False)
@router.get("/", response_model=List[MonitoringSiteResponse])
def list_monitoring_sites(
    skip: int = 0,
    limit: int = 100,
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_active_user)
):
    """List all active monitoring sites with related count statistics"""
    sites = db.query(MonitoringSite).filter(MonitoringSite.is_active == True).offset(skip).limit(limit).all()
    
    results = []
    for s in sites:
        survey_cnt = db.query(func.count(Survey.id)).filter(Survey.monitoring_site_id == s.id).scalar() or 0
        device_cnt = db.query(func.count(Device.id)).filter(Device.monitoring_site_id == s.id).scalar() or 0
        
        # Count observations belonging to this site's surveys
        obs_cnt = db.query(func.count(Observation.id))\
            .join(Survey, Observation.survey_id == Survey.id)\
            .filter(Survey.monitoring_site_id == s.id)\
            .scalar() or 0

        res_dict = {
            "id": s.id,
            "site_name": s.site_name,
            "site_code": s.site_code,
            "description": s.description,
            "latitude": s.latitude,
            "longitude": s.longitude,
            "altitude": s.altitude,
            "habitat_type": s.habitat_type,
            "area_km2": s.area_km2,
            "is_protected_area": s.is_protected_area,
            "protection_status": s.protection_status,
            "created_by_id": s.created_by_id,
            "is_active": s.is_active,
            "created_at": s.created_at,
            "updated_at": s.updated_at,
            "survey_count": survey_cnt,
            "observation_count": obs_cnt,
            "device_count": device_cnt
        }
        results.append(MonitoringSiteResponse(**res_dict))

    return results


@router.post("/", response_model=MonitoringSiteResponse, status_code=status.HTTP_201_CREATED)
def create_monitoring_site(
    site_in: MonitoringSiteCreate,
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_active_user)
):
    """Register a new wildlife monitoring site"""
    existing = db.query(MonitoringSite).filter(MonitoringSite.site_code == site_in.site_code).first()
    if existing:
        raise HTTPException(
            status_code=400,
            detail=f"Monitoring site with code '{site_in.site_code}' already exists"
        )

    site = MonitoringSite(
        site_name=site_in.site_name,
        site_code=site_in.site_code,
        description=site_in.description,
        latitude=site_in.latitude,
        longitude=site_in.longitude,
        altitude=site_in.altitude,
        habitat_type=site_in.habitat_type,
        area_km2=site_in.area_km2,
        is_protected_area=site_in.is_protected_area,
        protection_status=site_in.protection_status,
        created_by_id=current_user.id,
        is_active=True
    )
    db.add(site)
    db.commit()
    db.refresh(site)

    return MonitoringSiteResponse(
        **{c.name: getattr(site, c.name) for c in site.__table__.columns},
        survey_count=0,
        observation_count=0,
        device_count=0
    )


@router.get("/{site_id}", response_model=MonitoringSiteResponse)
def get_monitoring_site(
    site_id: int,
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_active_user)
):
    """Retrieve detailed monitoring site information"""
    site = db.query(MonitoringSite).filter(MonitoringSite.id == site_id).first()
    if not site:
        raise HTTPException(status_code=404, detail="Monitoring site not found")

    survey_cnt = db.query(func.count(Survey.id)).filter(Survey.monitoring_site_id == site.id).scalar() or 0
    device_cnt = db.query(func.count(Device.id)).filter(Device.monitoring_site_id == site.id).scalar() or 0
    obs_cnt = db.query(func.count(Observation.id))\
        .join(Survey, Observation.survey_id == Survey.id)\
        .filter(Survey.monitoring_site_id == site.id)\
        .scalar() or 0

    return MonitoringSiteResponse(
        **{c.name: getattr(site, c.name) for c in site.__table__.columns},
        survey_count=survey_cnt,
        observation_count=obs_cnt,
        device_count=device_cnt
    )


@router.put("/{site_id}", response_model=MonitoringSiteResponse)
def update_monitoring_site(
    site_id: int,
    site_in: MonitoringSiteUpdate,
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_active_user)
):
    """Update monitoring site details"""
    site = db.query(MonitoringSite).filter(MonitoringSite.id == site_id).first()
    if not site:
        raise HTTPException(status_code=404, detail="Monitoring site not found")

    update_data = site_in.dict(exclude_unset=True)
    for field, value in update_data.items():
        setattr(site, field, value)

    db.commit()
    db.refresh(site)

    return get_monitoring_site(site_id, db, current_user)


@router.delete("/{site_id}", status_code=status.HTTP_204_NO_CONTENT)
def delete_monitoring_site(
    site_id: int,
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_active_user)
):
    """Deactivate monitoring site"""
    site = db.query(MonitoringSite).filter(MonitoringSite.id == site_id).first()
    if not site:
        raise HTTPException(status_code=404, detail="Monitoring site not found")
    
    site.is_active = False
    db.commit()
    return None
