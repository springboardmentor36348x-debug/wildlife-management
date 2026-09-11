"""
Observation & Dataset models implementing FR-3 (Multi-Modal Dataset
Ingestion) and the data-plumbing the Milestone 2/3 AI pipelines will
attach detections to.
"""
import enum
import uuid
from datetime import datetime, timezone

from sqlalchemy import (
    Column, String, DateTime, ForeignKey, Enum as SAEnum, Float, Integer, Text
)
from sqlalchemy.orm import relationship

from app.db.session import Base


def _uuid() -> str:
    return str(uuid.uuid4())


class ObservationType(str, enum.Enum):
    IMAGE = "image"
    AUDIO = "audio"
    TELEMETRY = "telemetry"


class Observation(Base):
    __tablename__ = "observations"

    id = Column(String, primary_key=True, default=_uuid)
    site_id = Column(String, ForeignKey("monitoring_sites.id"), nullable=True)

    observation_type = Column(SAEnum(ObservationType), nullable=False)
    file_reference = Column(String, nullable=False)  # storage path / object key

    species_label = Column(String, nullable=True)
    confidence_score = Column(Float, nullable=True)

    captured_at = Column(DateTime, nullable=False)
    ingested_at = Column(DateTime, default=lambda: datetime.now(timezone.utc))
    notes = Column(Text, nullable=True)

    site = relationship("MonitoringSite", back_populates="observations")
    detections = relationship(
        "ObservationDetection", back_populates="observation", cascade="all, delete-orphan"
    )


class ObservationDetection(Base):
    """
    One detected animal (with bounding box) from a single
    detection run against an Observation's image.
    """
    __tablename__ = "observation_detections"

    id = Column(String, primary_key=True, default=_uuid)
    observation_id = Column(String, ForeignKey("observations.id"), nullable=False)

    label = Column(String, nullable=False)
    confidence = Column(Float, nullable=False)
    bbox_x = Column(Float, nullable=False)
    bbox_y = Column(Float, nullable=False)
    bbox_width = Column(Float, nullable=False)
    bbox_height = Column(Float, nullable=False)

    created_at = Column(DateTime, default=lambda: datetime.now(timezone.utc))

    observation = relationship("Observation", back_populates="detections")


class DatasetSource(str, enum.Enum):
    SNAPSHOT_SERENGETI = "snapshot_serengeti"
    INATURALIST = "inaturalist"
    BIRDCLEF = "birdclef"
    GBIF = "gbif"
    ANIMAL_KINGDOM = "animal_kingdom"
    CUSTOM_UPLOAD = "custom_upload"


class DatasetStatus(str, enum.Enum):
    REGISTERED = "registered"
    DOWNLOADING = "downloading"
    READY = "ready"
    FAILED = "failed"


class Dataset(Base):
    """
    Tracks external training/reference datasets registered for the
    pipeline (Snapshot Serengeti, iNaturalist, BirdCLEF, GBIF, etc.)
    """
    __tablename__ = "datasets"

    id = Column(String, primary_key=True, default=_uuid)
    name = Column(String, nullable=False)
    source = Column(SAEnum(DatasetSource), nullable=False)
    purpose = Column(String, nullable=True)
    record_count = Column(Integer, default=0)
    status = Column(SAEnum(DatasetStatus), default=DatasetStatus.REGISTERED)
    registered_at = Column(DateTime, default=lambda: datetime.now(timezone.utc))

    files = relationship("DatasetFile", back_populates="dataset", cascade="all, delete-orphan")
