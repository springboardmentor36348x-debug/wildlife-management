from datetime import datetime
from pydantic import BaseModel, Field

from app.models.survey import SurveyStatus, HabitatType, MonitoringDevice


class SurveyCreate(BaseModel):
    name: str = Field(..., min_length=2, max_length=200)
    description: str | None = None
    protected_area: str | None = None
    start_date: datetime
    end_date: datetime | None = None


class SurveyUpdate(BaseModel):
    name: str | None = None
    description: str | None = None
    protected_area: str | None = None
    status: SurveyStatus | None = None
    end_date: datetime | None = None


class SurveyOut(BaseModel):
    id: str
    name: str
    description: str | None
    protected_area: str | None
    status: SurveyStatus
    start_date: datetime
    end_date: datetime | None
    created_by: str
    created_at: datetime

    class Config:
        from_attributes = True


class MonitoringSiteCreate(BaseModel):
    survey_id: str
    site_name: str = Field(..., min_length=2, max_length=200)
    latitude: float = Field(..., ge=-90, le=90)
    longitude: float = Field(..., ge=-180, le=180)
    habitat_type: HabitatType = HabitatType.OTHER
    monitoring_device: MonitoringDevice = MonitoringDevice.CAMERA_TRAP
    protected_area: str | None = None


class MonitoringSiteOut(BaseModel):
    id: str
    survey_id: str
    site_name: str
    latitude: float
    longitude: float
    habitat_type: HabitatType
    monitoring_device: MonitoringDevice
    protected_area: str | None
    is_active: str
    created_at: datetime

    class Config:
        from_attributes = True
