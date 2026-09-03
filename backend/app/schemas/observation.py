import uuid
from datetime import datetime
from typing import Optional, List

from pydantic import BaseModel, ConfigDict

from app.models.observation import SourceType, SpeciesGroup, ConservationStatus


class SpeciesObservationOut(BaseModel):
    model_config = ConfigDict(from_attributes=True)

    id: uuid.UUID
    media_asset_id: uuid.UUID
    survey_id: Optional[uuid.UUID] = None
    species_common_name: str
    species_scientific_name: Optional[str] = None
    species_group: SpeciesGroup
    conservation_status: ConservationStatus
    confidence_score: float
    individual_count: int
    bounding_box: Optional[List[float]] = None
    behavior: Optional[str] = None
    acoustic_event_type: Optional[str] = None
    detected_at: datetime


class MediaAssetOut(BaseModel):
    model_config = ConfigDict(from_attributes=True)

    id: uuid.UUID
    survey_id: Optional[uuid.UUID] = None
    monitoring_site_id: uuid.UUID
    source_type: SourceType
    file_path: str
    original_filename: str
    quality_score: Optional[float] = None
    processed: str
    uploaded_at: datetime


class ImageAnalysisResult(BaseModel):
    """Response returned right after an image is uploaded & analyzed."""
    media_asset: MediaAssetOut
    detections: List[SpeciesObservationOut]
    quality_score: float
    processing_time_ms: float


class AudioAnalysisResult(BaseModel):
    """Response returned right after an audio file is uploaded & analyzed."""
    media_asset: MediaAssetOut
    detections: List[SpeciesObservationOut]
    processing_time_ms: float
