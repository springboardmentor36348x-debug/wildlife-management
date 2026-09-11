"""
Survey & Monitoring Site models implementing FR-2:
Survey & Site Tracking Management.
"""
import enum
import uuid
from datetime import datetime, timezone

from sqlalchemy import (
    Column, String, DateTime, Float, ForeignKey, Enum as SAEnum, Text
)
from sqlalchemy.orm import relationship

from app.db.session import Base


def _uuid() -> str:
    return str(uuid.uuid4())


class SurveyStatus(str, enum.Enum):
    PLANNED = "planned"
    ACTIVE = "active"
    COMPLETED = "completed"
    SUSPENDED = "suspended"


class HabitatType(str, enum.Enum):
    FOREST = "forest"
    GRASSLAND = "grassland"
    WETLAND = "wetland"
    RIVERINE = "riverine"
    MOUNTAIN = "mountain"
    MARINE = "marine"
    OTHER = "other"


class MonitoringDevice(str, enum.Enum):
    CAMERA_TRAP = "camera_trap"
    DRONE = "drone"
    AUDIO_SENSOR = "audio_sensor"
    SATELLITE = "satellite"
    MANUAL_SURVEY = "manual_survey"


class Survey(Base):
    """A multi-zone monitoring survey / project (FR-2)."""
    __tablename__ = "surveys"

    id = Column(String, primary_key=True, default=_uuid)
    name = Column(String, nullable=False)
    description = Column(Text, nullable=True)
    protected_area = Column(String, nullable=True)
    status = Column(SAEnum(SurveyStatus), default=SurveyStatus.PLANNED)
    start_date = Column(DateTime, nullable=False)
    end_date = Column(DateTime, nullable=True)

    created_by = Column(String, ForeignKey("users.id"), nullable=False)
    created_at = Column(DateTime, default=lambda: datetime.now(timezone.utc))

    created_by_user = relationship("User", back_populates="surveys")
    monitoring_sites = relationship(
        "MonitoringSite", back_populates="survey", cascade="all, delete-orphan"
    )


class MonitoringSite(Base):
    """
    A physical monitoring location (camera trap / drone / audio node)
    tied to a survey. GPS fields are plain floats here; once PostGIS is
    provisioned in Milestone 4 these can be migrated to a Geography column
    without changing the API contract.
    """
    __tablename__ = "monitoring_sites"

    id = Column(String, primary_key=True, default=_uuid)
    survey_id = Column(String, ForeignKey("surveys.id"), nullable=False)

    site_name = Column(String, nullable=False)
    latitude = Column(Float, nullable=False)
    longitude = Column(Float, nullable=False)
    habitat_type = Column(SAEnum(HabitatType), default=HabitatType.OTHER)
    monitoring_device = Column(SAEnum(MonitoringDevice), default=MonitoringDevice.CAMERA_TRAP)
    protected_area = Column(String, nullable=True)
    is_active = Column(String, default="true")  # kept simple/string for SQLite portability

    created_at = Column(DateTime, default=lambda: datetime.now(timezone.utc))

    survey = relationship("Survey", back_populates="monitoring_sites")
    observations = relationship(
        "Observation", back_populates="site", cascade="all, delete-orphan"
    )
