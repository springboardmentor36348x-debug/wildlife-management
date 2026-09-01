from pydantic import BaseModel, field_validator
from datetime import datetime
from typing import Optional
from models_monitoring import HabitatType, DeviceStatus, DetectionSource


# ---------- Monitoring Site ----------
class MonitoringSiteBase(BaseModel):
    site_name: str
    location: str
    latitude: float
    longitude: float
    habitat_type: HabitatType
    protected_area: Optional[str] = None
    description: Optional[str] = None

    @field_validator("latitude")
    @classmethod
    def valid_lat(cls, v):
        if not -90 <= v <= 90:
            raise ValueError("Latitude must be between -90 and 90")
        return v

    @field_validator("longitude")
    @classmethod
    def valid_lng(cls, v):
        if not -180 <= v <= 180:
            raise ValueError("Longitude must be between -180 and 180")
        return v


class MonitoringSiteCreate(MonitoringSiteBase):
    pass


class MonitoringSiteUpdate(MonitoringSiteBase):
    pass


class MonitoringSiteOut(MonitoringSiteBase):
    id: int
    created_at: datetime

    class Config:
        from_attributes = True


# ---------- Camera Trap ----------
class CameraTrapBase(BaseModel):
    camera_name: str
    monitoring_site_id: int
    installation_date: datetime
    status: DeviceStatus = DeviceStatus.active
    latitude: Optional[float] = None
    longitude: Optional[float] = None
    description: Optional[str] = None


class CameraTrapCreate(CameraTrapBase):
    pass


class CameraTrapUpdate(CameraTrapBase):
    pass


class CameraTrapOut(CameraTrapBase):
    id: int
    created_at: datetime
    monitoring_site_name: Optional[str] = None

    class Config:
        from_attributes = True


# ---------- Audio Sensor ----------
class AudioSensorBase(BaseModel):
    sensor_name: str
    monitoring_site_id: int
    installation_date: datetime
    status: DeviceStatus = DeviceStatus.active
    latitude: Optional[float] = None
    longitude: Optional[float] = None
    description: Optional[str] = None


class AudioSensorCreate(AudioSensorBase):
    pass


class AudioSensorUpdate(AudioSensorBase):
    pass


class AudioSensorOut(AudioSensorBase):
    id: int
    created_at: datetime
    monitoring_site_name: Optional[str] = None

    class Config:
        from_attributes = True


# ---------- Survey ----------
class SurveyBase(BaseModel):
    survey_name: str
    monitoring_site_id: int
    camera_trap_id: Optional[int] = None
    audio_sensor_id: Optional[int] = None
    survey_date: datetime
    description: Optional[str] = None


class SurveyCreate(SurveyBase):
    pass


class SurveyUpdate(SurveyBase):
    pass


class SurveyOut(SurveyBase):
    id: int
    created_at: datetime
    monitoring_site_name: Optional[str] = None
    camera_trap_name: Optional[str] = None
    audio_sensor_name: Optional[str] = None

    class Config:
        from_attributes = True


# ---------- Observation ----------
class ObservationBase(BaseModel):
    survey_id: Optional[int] = None
    monitoring_site_id: int
    observation_datetime: datetime
    species: str
    detection_source: DetectionSource = DetectionSource.manual
    camera_trap_id: Optional[int] = None
    audio_sensor_id: Optional[int] = None
    confidence_score: Optional[float] = None
    notes: Optional[str] = None


class ObservationCreate(ObservationBase):
    pass


class ObservationUpdate(ObservationBase):
    pass


class ObservationOut(ObservationBase):
    id: int
    created_at: datetime
    monitoring_site_name: Optional[str] = None
    survey_name: Optional[str] = None

    class Config:
        from_attributes = True


# ---------- Dashboard stats ----------
class MonitoringStats(BaseModel):
    total_surveys: int
    total_monitoring_sites: int
    active_camera_traps: int
    active_audio_sensors: int
    total_observations: int
