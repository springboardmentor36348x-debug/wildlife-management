from datetime import datetime
from pydantic import BaseModel


class NotificationOut(BaseModel):
    id: str
    alert_type: str
    severity: str
    title: str
    message: str
    site_id: str | None = None
    site_name: str | None = None
    species_label: str | None = None
    is_read: bool
    created_at: datetime
    updated_at: datetime

    class Config:
        from_attributes = True


class NotificationSummary(BaseModel):
    total: int
    unread: int
    critical: int
    warning: int
    info: int
