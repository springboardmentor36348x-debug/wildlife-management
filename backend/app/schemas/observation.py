from datetime import datetime
from pydantic import BaseModel, Field

from app.models.observation import ObservationType, DatasetSource, DatasetStatus


class ObservationCreate(BaseModel):
    site_id: str
    observation_type: ObservationType
    file_reference: str
    captured_at: datetime
    notes: str | None = None


class ObservationOut(BaseModel):
    id: str
    site_id: str | None
    observation_type: ObservationType
    file_reference: str
    species_label: str | None
    confidence_score: float | None
    captured_at: datetime
    ingested_at: datetime
    notes: str | None

    class Config:
        from_attributes = True


# ---- Milestone 2: Image-based species detection ----

class BoundingBox(BaseModel):
    x: float
    y: float
    width: float
    height: float


class DetectionItem(BaseModel):
    label: str
    confidence: float
    bbox: BoundingBox


class DetectionResult(BaseModel):
    observation_id: str
    detected: bool
    count: int
    detections: list[DetectionItem]
    top_label: str | None = None
    top_confidence: float | None = None


# ---- Milestone 3: Bioacoustic species detection ----

class SoundMatch(BaseModel):
    label: str
    raw_class: str
    confidence: float


class SoundDetectionResult(BaseModel):
    observation_id: str
    detected: bool
    label: str | None = None
    confidence: float | None = None
    all_matches: list[SoundMatch]


class DatasetCreate(BaseModel):
    name: str = Field(..., min_length=2, max_length=200)
    source: DatasetSource
    purpose: str | None = None
    record_count: int = 0


class DatasetOut(BaseModel):
    id: str
    name: str
    source: DatasetSource
    purpose: str | None
    record_count: int
    status: DatasetStatus
    registered_at: datetime

    class Config:
        from_attributes = True
