from typing import List

from fastapi import APIRouter, Depends, HTTPException
from sqlalchemy.orm import Session

from app.auth.dependencies import get_current_user
from app.database import get_db
from app.models.user import User
from app.models.survey import MonitoringSite, MonitoringDevice
from app.schemas.survey import (
    MonitoringSiteCreate, MonitoringSiteOut,
    MonitoringDeviceCreate, MonitoringDeviceOut,
)

router = APIRouter(prefix="/api/v1/monitoring-sites", tags=["Monitoring Sites"])


@router.post("/", response_model=MonitoringSiteOut, status_code=201)
def create_monitoring_site(
    payload: MonitoringSiteCreate,
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user),
):
    site = MonitoringSite(**payload.model_dump(), created_by=current_user.id)
    db.add(site)
    db.commit()
    db.refresh(site)
    return site


@router.get("/", response_model=List[MonitoringSiteOut])
def list_monitoring_sites(db: Session = Depends(get_db), _: User = Depends(get_current_user)):
    return db.query(MonitoringSite).order_by(MonitoringSite.created_at.desc()).all()


@router.get("/{site_id}", response_model=MonitoringSiteOut)
def get_monitoring_site(site_id: str, db: Session = Depends(get_db), _: User = Depends(get_current_user)):
    site = db.query(MonitoringSite).filter(MonitoringSite.id == site_id).first()
    if not site:
        raise HTTPException(status_code=404, detail="Monitoring site not found.")
    return site


@router.post("/devices", response_model=MonitoringDeviceOut, status_code=201)
def register_device(
    payload: MonitoringDeviceCreate,
    db: Session = Depends(get_db),
    _: User = Depends(get_current_user),
):
    """Register a camera trap / audio sensor / drone at a monitoring site."""
    site = db.query(MonitoringSite).filter(MonitoringSite.id == payload.monitoring_site_id).first()
    if not site:
        raise HTTPException(status_code=404, detail="Monitoring site not found.")

    device = MonitoringDevice(**payload.model_dump())
    db.add(device)
    db.commit()
    db.refresh(device)
    return device


@router.get("/{site_id}/devices", response_model=List[MonitoringDeviceOut])
def list_site_devices(site_id: str, db: Session = Depends(get_db), _: User = Depends(get_current_user)):
    return db.query(MonitoringDevice).filter(MonitoringDevice.monitoring_site_id == site_id).all()
