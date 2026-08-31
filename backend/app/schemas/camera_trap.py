from pydantic import BaseModel
from datetime import date


class CameraTrapCreate(BaseModel):
    monitoring_site_id: str
    device_code: str
    model_name: str | None = None
    installation_date: date
    status: str | None = "active"
    battery_level: float | None = 100.0


class CameraTrapResponse(BaseModel):
    id: str
    monitoring_site_id: str
    device_code: str
    model_name: str | None
    installation_date: date
    status: str
    battery_level: float

    class Config:
        from_attributes = True