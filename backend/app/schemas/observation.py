from pydantic import BaseModel
from datetime import datetime


class ObservationCreate(BaseModel):
    monitoring_site_id: str
    camera_trap_id: str | None = None
    species_name: str
    observation_type: str
    notes: str | None = None


class ObservationResponse(BaseModel):
    id: str
    monitoring_site_id: str
    camera_trap_id: str | None
    species_name: str
    observation_type: str
    notes: str | None
    observed_at: datetime

    class Config:
        from_attributes = True