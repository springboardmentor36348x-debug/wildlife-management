from pydantic import BaseModel
from typing import Optional
from pydantic import BaseModel


class MonitoringSiteCreate(BaseModel):
    survey_id: str
    site_name: str
    latitude: float
    longitude: float
    habitat_type: str
    protected_area: str | None = None
    monitoring_device: str | None = None


class MonitoringSiteResponse(BaseModel):
    id: str
    survey_id: str
    site_name: str
    latitude: float
    longitude: float
    habitat_type: str
    protected_area: str | None
    monitoring_device: str | None

    class Config:
        from_attributes = True


class MonitoringSiteUpdate(BaseModel):
    site_name: Optional[str] = None
    latitude: Optional[float] = None
    longitude: Optional[float] = None
    habitat_type: Optional[str] = None
    protected_area: Optional[str] = None
    monitoring_device: Optional[str] = None

