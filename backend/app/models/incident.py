"""
Incident and action tracking models for Forest Department, Conservation, and Reporting.
"""
import enum
import uuid
from datetime import datetime, timezone
from sqlalchemy import (
    Column, String, DateTime, Float, ForeignKey, Enum as SAEnum, Text, Integer, JSON
)
from sqlalchemy.orm import relationship

from app.db.session import Base


def _uuid() -> str:
    return str(uuid.uuid4())


class IncidentType(str, enum.Enum):
    POACHING = "poaching"
    HUMAN_WILDLIFE_CONFLICT = "human_wildlife_conflict"
    DEVICE_TAMPERING = "device_tampering"
    ILLEGAL_LOGGING = "illegal_logging"
    FOREST_FIRE = "forest_fire"
    INVASIVE_SPECIES = "invasive_species"
    OTHER = "other"


class IncidentSeverity(str, enum.Enum):
    LOW = "low"
    MEDIUM = "medium"
    HIGH = "high"
    CRITICAL = "critical"


class IncidentStatus(str, enum.Enum):
    OPEN = "open"
    IN_PROGRESS = "in_progress"
    RESOLVED = "resolved"
    CLOSED = "closed"


class Incident(Base):
    """
    Field incidents logged by Forest Department Officers, Rangers, or automated alert escalation.
    """
    __tablename__ = "incidents"

    id = Column(String, primary_key=True, default=_uuid)
    title = Column(String, nullable=False)
    description = Column(Text, nullable=True)
    incident_type = Column(SAEnum(IncidentType), default=IncidentType.OTHER, nullable=False)
    severity = Column(SAEnum(IncidentSeverity), default=IncidentSeverity.MEDIUM, nullable=False)
    status = Column(SAEnum(IncidentStatus), default=IncidentStatus.OPEN, nullable=False)

    site_id = Column(String, ForeignKey("monitoring_sites.id"), nullable=True)
    survey_id = Column(String, ForeignKey("surveys.id"), nullable=True)
    latitude = Column(Float, nullable=True)
    longitude = Column(Float, nullable=True)

    reported_by = Column(String, ForeignKey("users.id"), nullable=False)
    reported_at = Column(DateTime, default=lambda: datetime.now(timezone.utc), nullable=False)
    alert_id = Column(String, nullable=True)
    actions_taken = Column(Text, nullable=True)

    reporter = relationship("User", foreign_keys=[reported_by])
    site = relationship("MonitoringSite", foreign_keys=[site_id])
    survey = relationship("Survey", foreign_keys=[survey_id])


class ActionStatus(str, enum.Enum):
    OPEN = "open"
    IN_PROGRESS = "in_progress"
    COMPLETED = "completed"


class RestorationActionRecord(Base):
    """
    Tracks action status of habitat restoration recommendations per site.
    """
    __tablename__ = "restoration_action_records"

    id = Column(String, primary_key=True, default=_uuid)
    site_id = Column(String, ForeignKey("monitoring_sites.id"), nullable=False)
    action_text = Column(Text, nullable=False)
    status = Column(SAEnum(ActionStatus), default=ActionStatus.OPEN, nullable=False)
    assigned_to = Column(String, ForeignKey("users.id"), nullable=True)
    notes = Column(Text, nullable=True)
    created_at = Column(DateTime, default=lambda: datetime.now(timezone.utc), nullable=False)
    updated_at = Column(DateTime, default=lambda: datetime.now(timezone.utc), onupdate=lambda: datetime.now(timezone.utc), nullable=False)

    site = relationship("MonitoringSite", foreign_keys=[site_id])
    assignee = relationship("User", foreign_keys=[assigned_to])


class ReportFormat(str, enum.Enum):
    PDF = "pdf"
    EXCEL = "excel"


class ReportType(str, enum.Enum):
    WILDLIFE_SURVEY = "wildlife_survey"
    SPECIES_POPULATION = "species_population"
    BIODIVERSITY = "biodiversity"
    HABITAT_ASSESSMENT = "habitat_assessment"
    CONSERVATION = "conservation"


class GeneratedReport(Base):
    """
    Persistent registry of generated export reports (PDF / Excel) with metadata and file path.
    """
    __tablename__ = "generated_reports"

    id = Column(String, primary_key=True, default=_uuid)
    title = Column(String, nullable=False)
    report_type = Column(SAEnum(ReportType), nullable=False)
    file_format = Column(SAEnum(ReportFormat), nullable=False)
    file_path = Column(String, nullable=False)
    file_size_bytes = Column(Integer, default=0, nullable=False)
    download_url = Column(String, nullable=False)
    
    filters_json = Column(JSON, nullable=True)
    summary_metrics = Column(JSON, nullable=True)
    generated_by = Column(String, ForeignKey("users.id"), nullable=False)
    created_at = Column(DateTime, default=lambda: datetime.now(timezone.utc), nullable=False)
    download_count = Column(Integer, default=0, nullable=False)

    generator_user = relationship("User", foreign_keys=[generated_by])
