from datetime import datetime
from pydantic import BaseModel, Field
from app.models.incident import IncidentType, IncidentSeverity, IncidentStatus, ActionStatus


class IncidentCreate(BaseModel):
    title: str = Field(..., min_length=3, max_length=200)
    description: str | None = None
    incident_type: IncidentType = IncidentType.OTHER
    severity: IncidentSeverity = IncidentSeverity.MEDIUM
    status: IncidentStatus = IncidentStatus.OPEN
    site_id: str | None = None
    survey_id: str | None = None
    latitude: float | None = None
    longitude: float | None = None
    alert_id: str | None = None
    actions_taken: str | None = None


class IncidentUpdate(BaseModel):
    title: str | None = None
    description: str | None = None
    incident_type: IncidentType | None = None
    severity: IncidentSeverity | None = None
    status: IncidentStatus | None = None
    site_id: str | None = None
    survey_id: str | None = None
    latitude: float | None = None
    longitude: float | None = None
    actions_taken: str | None = None


class IncidentOut(BaseModel):
    id: str
    title: str
    description: str | None = None
    incident_type: IncidentType
    severity: IncidentSeverity
    status: IncidentStatus
    site_id: str | None = None
    site_name: str | None = None
    survey_id: str | None = None
    survey_name: str | None = None
    latitude: float | None = None
    longitude: float | None = None
    reported_by: str
    reporter_name: str | None = None
    reported_at: datetime
    alert_id: str | None = None
    actions_taken: str | None = None

    class Config:
        from_attributes = True


class RestorationStatusUpdate(BaseModel):
    status: ActionStatus
    notes: str | None = None
    assigned_to: str | None = None


class RestorationActionOut(BaseModel):
    id: str
    site_id: str
    site_name: str | None = None
    action_text: str
    status: ActionStatus
    assigned_to: str | None = None
    assignee_name: str | None = None
    notes: str | None = None
    created_at: datetime
    updated_at: datetime

    class Config:
        from_attributes = True
