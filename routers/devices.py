"""
Devices Router (Camera traps, bioacoustic sensors, drones)
"""

from fastapi import APIRouter, Depends, HTTPException, status
from sqlalchemy.orm import Session
from typing import List, Optional

from database import get_db
from models import Device, MonitoringSite, User
from schemas.monitoring import DeviceCreate, DeviceUpdate, DeviceResponse
from security import get_current_active_user

router = APIRouter()


@router.get("/", response_model=List[DeviceResponse])
def list_devices(
    site_id: Optional[int] = None,
    skip: int = 0,
    limit: int = 100,
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_active_user)
):
    """List monitoring devices"""
    query = db.query(Device).filter(Device.is_active == True)
    if site_id:
        query = query.filter(Device.monitoring_site_id == site_id)
    devices = query.offset(skip).limit(limit).all()

    results = []
    for d in devices:
        results.append(DeviceResponse(
            id=d.id,
            device_id=d.device_id,
            device_name=d.device_name,
            device_type=d.device_type,
            monitoring_site_id=d.monitoring_site_id,
            location_latitude=d.location_latitude,
            location_longitude=d.location_longitude,
            battery_level=d.battery_level,
            is_active=d.is_active,
            last_sync=d.last_sync,
            created_at=d.created_at,
            monitoring_site_name=d.monitoring_site.site_name if d.monitoring_site else None
        ))
    return results


@router.post("/", response_model=DeviceResponse, status_code=status.HTTP_201_CREATED)
def create_device(
    device_in: DeviceCreate,
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_active_user)
):
    """Register a new monitoring device"""
    existing = db.query(Device).filter(Device.device_id == device_in.device_id).first()
    if existing:
        raise HTTPException(status_code=400, detail=f"Device with ID '{device_in.device_id}' already registered")

    device = Device(
        device_id=device_in.device_id,
        device_name=device_in.device_name,
        device_type=device_in.device_type,
        monitoring_site_id=device_in.monitoring_site_id,
        location_latitude=device_in.location_latitude,
        location_longitude=device_in.location_longitude,
        battery_level=device_in.battery_level or 100,
        is_active=True
    )
    db.add(device)
    db.commit()
    db.refresh(device)

    return DeviceResponse(
        id=device.id,
        device_id=device.device_id,
        device_name=device.device_name,
        device_type=device.device_type,
        monitoring_site_id=device.monitoring_site_id,
        location_latitude=device.location_latitude,
        location_longitude=device.location_longitude,
        battery_level=device.battery_level,
        is_active=device.is_active,
        last_sync=device.last_sync,
        created_at=device.created_at,
        monitoring_site_name=device.monitoring_site.site_name if device.monitoring_site else None
    )


@router.delete("/{device_id_pk}", status_code=status.HTTP_204_NO_CONTENT)
def delete_device(
    device_id_pk: int,
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_active_user)
):
    """Deactivate device"""
    d = db.query(Device).filter(Device.id == device_id_pk).first()
    if not d:
        raise HTTPException(status_code=404, detail="Device not found")
    d.is_active = False
    db.commit()
    return None
