"""
Monitoring Management Schemas (Sites, Surveys, Devices, Observations)
"""

from pydantic import BaseModel, Field
from typing import Optional, List, Any
from datetime import datetime
from models import HabitatType, DeviceType


# Monitoring Site Schemas
class MonitoringSiteBase(BaseModel):
    site_name: str
    site_code: str
    description: Optional[str] = None
    latitude: float = Field(..., ge=-90, le=90)
    longitude: float = Field(..., ge=-180, le=180)
    altitude: Optional[float] = None
    habitat_type: HabitatType = HabitatType.FOREST
    area_km2: Optional[float] = 100.0
    is_protected_area: bool = True
    protection_status: Optional[str] = "National Park / Tiger Reserve"


class MonitoringSiteCreate(MonitoringSiteBase):
    pass


class MonitoringSiteUpdate(BaseModel):
    site_name: Optional[str] = None
    site_code: Optional[str] = None
    description: Optional[str] = None
    latitude: Optional[float] = None
    longitude: Optional[float] = None
    altitude: Optional[float] = None
    habitat_type: Optional[HabitatType] = None
    area_km2: Optional[float] = None
    is_protected_area: Optional[bool] = None
    protection_status: Optional[str] = None
    is_active: Optional[bool] = None


class MonitoringSiteResponse(MonitoringSiteBase):
    id: int
    created_by_id: int
    is_active: bool
    created_at: Optional[datetime] = None
    updated_at: Optional[datetime] = None
    survey_count: Optional[int] = 0
    observation_count: Optional[int] = 0
    device_count: Optional[int] = 0

    class Config:
        from_attributes = True


# Survey Schemas
class SurveyBase(BaseModel):
    survey_id: str
    survey_name: str
    monitoring_site_id: int
    survey_date: datetime
    survey_duration_hours: Optional[float] = 4.0
    weather_conditions: Optional[str] = "Clear / Sunny"
    notes: Optional[str] = None


class SurveyCreate(SurveyBase):
    pass


class SurveyUpdate(BaseModel):
    survey_name: Optional[str] = None
    monitoring_site_id: Optional[int] = None
    survey_date: Optional[datetime] = None
    survey_duration_hours: Optional[float] = None
    weather_conditions: Optional[str] = None
    notes: Optional[str] = None
    is_active: Optional[bool] = None


class SurveyResponse(SurveyBase):
    id: int
    created_by_id: int
    is_active: bool
    created_at: Optional[datetime] = None
    monitoring_site_name: Optional[str] = None
    observation_count: Optional[int] = 0

    class Config:
        from_attributes = True


# Device Schemas
class DeviceBase(BaseModel):
    device_id: str
    device_name: str
    device_type: DeviceType = DeviceType.CAMERA_TRAP
    monitoring_site_id: int
    location_latitude: Optional[float] = None
    location_longitude: Optional[float] = None
    battery_level: Optional[int] = 100


class DeviceCreate(DeviceBase):
    pass


class DeviceUpdate(BaseModel):
    device_name: Optional[str] = None
    device_type: Optional[DeviceType] = None
    monitoring_site_id: Optional[int] = None
    location_latitude: Optional[float] = None
    location_longitude: Optional[float] = None
    battery_level: Optional[int] = None
    is_active: Optional[bool] = None


class DeviceResponse(DeviceBase):
    id: int
    is_active: bool
    last_sync: Optional[datetime] = None
    created_at: Optional[datetime] = None
    monitoring_site_name: Optional[str] = None

    class Config:
        from_attributes = True


# Observation Schemas
class ObservationBase(BaseModel):
    observation_id: str
    survey_id: int
    species_id: Optional[int] = None
    device_id: Optional[int] = None
    observation_type: str = "image"  # image, audio, manual
    observation_date: datetime
    latitude: Optional[float] = None
    longitude: Optional[float] = None
    count: int = 1
    confidence_score: Optional[float] = None
    behavior_observed: Optional[str] = None
    notes: Optional[str] = None
    file_path: Optional[str] = None


class ObservationCreate(ObservationBase):
    pass


class ObservationResponse(ObservationBase):
    id: int
    created_by_id: int
    created_at: Optional[datetime] = None
    species_name: Optional[str] = None
    scientific_name: Optional[str] = None
    species_group: Optional[str] = None
    is_endangered: Optional[bool] = False
    site_name: Optional[str] = None

    class Config:
        from_attributes = True
