import enum
import uuid
from datetime import datetime

from sqlalchemy import Column, String, DateTime, Enum, Float, ForeignKey, Text
from app.db_types import GUID
from sqlalchemy.orm import relationship

from app.database import Base


class HabitatType(str, enum.Enum):
    FOREST = "forest"
    GRASSLAND = "grassland"
    WETLAND = "wetland"
    RIVERINE = "riverine"
    MOUNTAIN = "mountain"
    COASTAL = "coastal"
    OTHER = "other"


class MonitoringDeviceType(str, enum.Enum):
    CAMERA_TRAP = "camera_trap"
    AUDIO_SENSOR = "audio_sensor"
    DRONE = "drone"
    SATELLITE = "satellite"


class MonitoringSite(Base):
    """A registered location where surveys / sensors operate."""
    __tablename__ = "monitoring_sites"

    id = Column(GUID(), primary_key=True, default=uuid.uuid4)
    name = Column(String(150), nullable=False)
    latitude = Column(Float, nullable=False)
    longitude = Column(Float, nullable=False)
    habitat_type = Column(Enum(HabitatType), default=HabitatType.OTHER)
    protected_area = Column(String(150), nullable=True)
    description = Column(Text, nullable=True)
    created_by = Column(GUID(), ForeignKey("users.id"), nullable=False)
    created_at = Column(DateTime, default=datetime.utcnow)

    surveys = relationship("Survey", back_populates="monitoring_site")
    devices = relationship("MonitoringDevice", back_populates="monitoring_site")


class MonitoringDevice(Base):
    """Camera trap / audio sensor / drone registered at a site."""
    __tablename__ = "monitoring_devices"

    id = Column(GUID(), primary_key=True, default=uuid.uuid4)
    monitoring_site_id = Column(GUID(), ForeignKey("monitoring_sites.id"), nullable=False)
    device_type = Column(Enum(MonitoringDeviceType), nullable=False)
    device_code = Column(String(100), nullable=False)
    is_active = Column(String(20), default="active")
    installed_at = Column(DateTime, default=datetime.utcnow)

    monitoring_site = relationship("MonitoringSite", back_populates="devices")


class Survey(Base):
    """A monitoring/survey campaign run at a site over a date range."""
    __tablename__ = "surveys"

    id = Column(GUID(), primary_key=True, default=uuid.uuid4)
    survey_name = Column(String(150), nullable=False)
    monitoring_site_id = Column(GUID(), ForeignKey("monitoring_sites.id"), nullable=False)
    survey_date = Column(DateTime, nullable=False)
    notes = Column(Text, nullable=True)
    created_by = Column(GUID(), ForeignKey("users.id"), nullable=False)
    created_at = Column(DateTime, default=datetime.utcnow)

    monitoring_site = relationship("MonitoringSite", back_populates="surveys")
    observations = relationship("SpeciesObservation", back_populates="survey")
