import enum
import uuid
from datetime import datetime

from sqlalchemy import Column, String, DateTime, Enum, Float, Integer, ForeignKey, Text, JSON
from app.db_types import GUID
from sqlalchemy.orm import relationship

from app.database import Base


class SourceType(str, enum.Enum):
    IMAGE = "image"
    AUDIO = "audio"


class SpeciesGroup(str, enum.Enum):
    MAMMAL = "mammal"
    BIRD = "bird"
    REPTILE = "reptile"
    AMPHIBIAN = "amphibian"
    INSECT = "insect"
    MARINE = "marine"
    UNKNOWN = "unknown"


class ConservationStatus(str, enum.Enum):
    LEAST_CONCERN = "least_concern"
    NEAR_THREATENED = "near_threatened"
    VULNERABLE = "vulnerable"
    ENDANGERED = "endangered"
    CRITICALLY_ENDANGERED = "critically_endangered"
    UNKNOWN = "unknown"


class MediaAsset(Base):
    """An uploaded camera-trap/drone image OR an audio recording."""
    __tablename__ = "media_assets"

    id = Column(GUID(), primary_key=True, default=uuid.uuid4)
    survey_id = Column(GUID(), ForeignKey("surveys.id"), nullable=True)
    monitoring_site_id = Column(GUID(), ForeignKey("monitoring_sites.id"), nullable=False)
    source_type = Column(Enum(SourceType), nullable=False)
    file_path = Column(String(500), nullable=False)
    original_filename = Column(String(255), nullable=False)
    captured_at = Column(DateTime, nullable=True)
    uploaded_by = Column(GUID(), ForeignKey("users.id"), nullable=False)
    uploaded_at = Column(DateTime, default=datetime.utcnow)

    # Quality / processing metadata (Image Recognition Features -> Image Quality Assessment)
    quality_score = Column(Float, nullable=True)
    processed = Column(String(20), default="pending")  # pending | processed | failed

    observations = relationship("SpeciesObservation", back_populates="media_asset")


class SpeciesObservation(Base):
    """
    A single detected animal/species instance produced by the
    Image Analysis Engine or Bioacoustic Recognition Engine.
    """
    __tablename__ = "species_observations"

    id = Column(GUID(), primary_key=True, default=uuid.uuid4)
    survey_id = Column(GUID(), ForeignKey("surveys.id"), nullable=True)
    media_asset_id = Column(GUID(), ForeignKey("media_assets.id"), nullable=False)

    species_common_name = Column(String(150), nullable=False)
    species_scientific_name = Column(String(150), nullable=True)
    species_group = Column(Enum(SpeciesGroup), default=SpeciesGroup.UNKNOWN)
    conservation_status = Column(Enum(ConservationStatus), default=ConservationStatus.UNKNOWN)

    confidence_score = Column(Float, nullable=False, default=0.0)
    individual_count = Column(Integer, default=1)

    # bounding box for image detections: [x1, y1, x2, y2] normalized 0-1
    bounding_box = Column(JSON, nullable=True)

    # detected animal behavior tag (e.g. "foraging", "resting", "moving") - image engine
    behavior = Column(String(100), nullable=True)

    # for audio detections: acoustic event type (e.g. "call", "song", "alarm")
    acoustic_event_type = Column(String(100), nullable=True)

    detected_at = Column(DateTime, default=datetime.utcnow)

    media_asset = relationship("MediaAsset", back_populates="observations")
    survey = relationship("Survey", back_populates="observations")
