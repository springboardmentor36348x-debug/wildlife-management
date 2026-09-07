import uuid
from datetime import datetime
from typing import Optional

from pydantic import BaseModel, ConfigDict

from app.models.survey import HabitatType, MonitoringDeviceType


class MonitoringSiteCreate(BaseModel):
    name: str
    latitude: float
    longitude: float
    habitat_type: HabitatType = HabitatType.OTHER
    protected_area: Optional[str] = None
    description: Optional[str] = None


class MonitoringSiteOut(BaseModel):
    model_config = ConfigDict(from_attributes=True)

    id: uuid.UUID
    name: str
    latitude: float
    longitude: float
    habitat_type: HabitatType
    protected_area: Optional[str] = None
    description: Optional[str] = None
    created_at: datetime


class MonitoringDeviceCreate(BaseModel):
    monitoring_site_id: uuid.UUID
    device_type: MonitoringDeviceType
    device_code: str


class MonitoringDeviceOut(BaseModel):
    model_config = ConfigDict(from_attributes=True)

    id: uuid.UUID
    monitoring_site_id: uuid.UUID
    device_type: MonitoringDeviceType
    device_code: str
    is_active: str
    installed_at: datetime


class SurveyCreate(BaseModel):
    survey_name: str
    monitoring_site_id: uuid.UUID
    survey_date: datetime
    notes: Optional[str] = None


class SurveyOut(BaseModel):
    model_config = ConfigDict(from_attributes=True)

    id: uuid.UUID
    survey_name: str
    monitoring_site_id: uuid.UUID
    survey_date: datetime
    notes: Optional[str] = None
    created_at: datetime
