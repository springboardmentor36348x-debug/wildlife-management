"""
Part 2 — Wildlife Survey & Monitoring Management.

New tables only. Does not modify models.py / the existing User table.
Import this module once (in main.py, before Base.metadata.create_all)
so SQLAlchemy registers these tables on the same Base as Part 1.
"""
from sqlalchemy import Column, Integer, String, Float, DateTime, Enum, ForeignKey, Text
from sqlalchemy.orm import relationship
from sqlalchemy.sql import func
import enum
from database import Base


class HabitatType(str, enum.Enum):
    forest = "Forest"
    grassland = "Grassland"
    wetland = "Wetland"
    desert = "Desert"
    mountain = "Mountain"
    coastal = "Coastal"
    other = "Other"


class DeviceStatus(str, enum.Enum):
    active = "active"
    inactive = "inactive"
    maintenance = "maintenance"


class DetectionSource(str, enum.Enum):
    manual = "manual"
    camera_trap = "camera_trap"
    audio_sensor = "audio_sensor"


class MonitoringSite(Base):
    __tablename__ = "monitoring_sites"

    id = Column(Integer, primary_key=True, index=True)
    site_name = Column(String, nullable=False, index=True)
    location = Column(String, nullable=False)
    latitude = Column(Float, nullable=False)
    longitude = Column(Float, nullable=False)
    habitat_type = Column(Enum(HabitatType, name="habitattype"), nullable=False)
    protected_area = Column(String, nullable=True)
    description = Column(Text, nullable=True)
    created_by_id = Column(Integer, ForeignKey("users.id"), nullable=True)
    created_at = Column(DateTime(timezone=True), server_default=func.now())
    updated_at = Column(DateTime(timezone=True), onupdate=func.now())

    surveys = relationship("Survey", back_populates="monitoring_site", cascade="all, delete-orphan")
    camera_traps = relationship("CameraTrap", back_populates="monitoring_site", cascade="all, delete-orphan")
    audio_sensors = relationship("AudioSensor", back_populates="monitoring_site", cascade="all, delete-orphan")
    observations = relationship("Observation", back_populates="monitoring_site")


class CameraTrap(Base):
    __tablename__ = "camera_traps"

    id = Column(Integer, primary_key=True, index=True)
    camera_name = Column(String, nullable=False)
    monitoring_site_id = Column(Integer, ForeignKey("monitoring_sites.id"), nullable=False)
    installation_date = Column(DateTime(timezone=True), nullable=False)
    status = Column(Enum(DeviceStatus, name="devicestatus_camera"), default=DeviceStatus.active, nullable=False)
    latitude = Column(Float, nullable=True)
    longitude = Column(Float, nullable=True)
    description = Column(Text, nullable=True)
    created_by_id = Column(Integer, ForeignKey("users.id"), nullable=True)
    created_at = Column(DateTime(timezone=True), server_default=func.now())
    updated_at = Column(DateTime(timezone=True), onupdate=func.now())

    monitoring_site = relationship("MonitoringSite", back_populates="camera_traps")
    surveys = relationship("Survey", back_populates="camera_trap")
    observations = relationship("Observation", back_populates="camera_trap")


class AudioSensor(Base):
    __tablename__ = "audio_sensors"

    id = Column(Integer, primary_key=True, index=True)
    sensor_name = Column(String, nullable=False)
    monitoring_site_id = Column(Integer, ForeignKey("monitoring_sites.id"), nullable=False)
    installation_date = Column(DateTime(timezone=True), nullable=False)
    status = Column(Enum(DeviceStatus, name="devicestatus_audio"), default=DeviceStatus.active, nullable=False)
    latitude = Column(Float, nullable=True)
    longitude = Column(Float, nullable=True)
    description = Column(Text, nullable=True)
    created_by_id = Column(Integer, ForeignKey("users.id"), nullable=True)
    created_at = Column(DateTime(timezone=True), server_default=func.now())
    updated_at = Column(DateTime(timezone=True), onupdate=func.now())

    monitoring_site = relationship("MonitoringSite", back_populates="audio_sensors")
    surveys = relationship("Survey", back_populates="audio_sensor")
    observations = relationship("Observation", back_populates="audio_sensor")


class Survey(Base):
    __tablename__ = "surveys"

    id = Column(Integer, primary_key=True, index=True)
    survey_name = Column(String, nullable=False)
    monitoring_site_id = Column(Integer, ForeignKey("monitoring_sites.id"), nullable=False)
    # "Monitoring Device" — optionally points at whichever device ran the survey.
    # GPS / habitat type / protected area are NOT duplicated here — they live on
    # MonitoringSite and are reached via the relationship.
    camera_trap_id = Column(Integer, ForeignKey("camera_traps.id"), nullable=True)
    audio_sensor_id = Column(Integer, ForeignKey("audio_sensors.id"), nullable=True)
    survey_date = Column(DateTime(timezone=True), nullable=False)
    description = Column(Text, nullable=True)
    created_by_id = Column(Integer, ForeignKey("users.id"), nullable=True)
    created_at = Column(DateTime(timezone=True), server_default=func.now())
    updated_at = Column(DateTime(timezone=True), onupdate=func.now())

    monitoring_site = relationship("MonitoringSite", back_populates="surveys")
    camera_trap = relationship("CameraTrap", back_populates="surveys")
    audio_sensor = relationship("AudioSensor", back_populates="surveys")
    observations = relationship("Observation", back_populates="survey")


class Observation(Base):
    __tablename__ = "observations"

    id = Column(Integer, primary_key=True, index=True)
    survey_id = Column(Integer, ForeignKey("surveys.id"), nullable=True)
    monitoring_site_id = Column(Integer, ForeignKey("monitoring_sites.id"), nullable=False)
    observation_datetime = Column(DateTime(timezone=True), nullable=False)
    species = Column(String, nullable=False, index=True)
    detection_source = Column(Enum(DetectionSource, name="detectionsource"), default=DetectionSource.manual, nullable=False)
    camera_trap_id = Column(Integer, ForeignKey("camera_traps.id"), nullable=True)
    audio_sensor_id = Column(Integer, ForeignKey("audio_sensors.id"), nullable=True)
    # Reserved for the future AI Image/Bioacoustic engines (Part 3) — not
    # populated by any AI workflow yet, just storable/editable manually.
    confidence_score = Column(Float, nullable=True)
    notes = Column(Text, nullable=True)
    created_by_id = Column(Integer, ForeignKey("users.id"), nullable=True)
    created_at = Column(DateTime(timezone=True), server_default=func.now())
    updated_at = Column(DateTime(timezone=True), onupdate=func.now())

    survey = relationship("Survey", back_populates="observations")
    monitoring_site = relationship("MonitoringSite", back_populates="observations")
    camera_trap = relationship("CameraTrap", back_populates="observations")
    audio_sensor = relationship("AudioSensor", back_populates="observations")
