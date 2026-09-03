"""
AI Image and Audio Analysis Schemas
"""

from pydantic import BaseModel
from typing import Optional, List, Dict, Any
from datetime import datetime


class BoundingBox(BaseModel):
    label: str
    confidence: float
    box: List[float]  # [x1, y1, x2, y2] or [ymin, xmin, ymax, xmax]
    species_group: Optional[str] = "Mammal"


class DetectedAnimal(BaseModel):
    species: str
    count: int
    confidence: float
    is_endangered: bool = False
    conservation_status: str = "Least Concern"


class ImageAnalysisResult(BaseModel):
    filename: str
    file_path: str
    detected_species: Optional[str] = None
    confidence: float = 0.0
    animal_count: int = 0
    detections: List[BoundingBox] = []
    animals_summary: List[DetectedAnimal] = []
    image_quality: str = "good"  # good, fair, poor
    behavior_detected: Optional[str] = "Resting / Alert"
    processing_time_ms: float
    model_version: str = "YOLOv8x-Wildlife-v1.0"
    is_demo_fallback: bool = False
    notes: Optional[str] = None


class AudioAnalysisResult(BaseModel):
    filename: str
    file_path: str
    detected_species: Optional[str] = None
    scientific_name: Optional[str] = None
    species_group: str = "Bird"
    confidence: float = 0.0
    call_type: str = "Territorial Call"
    frequency_range: str = "1.5 kHz - 8.2 kHz"
    duration_seconds: float = 0.0
    sample_rate: int = 22050
    noise_level: float = 0.15
    audio_quality: str = "good"
    features: Dict[str, Any] = {}
    spectrogram_url: Optional[str] = None
    processing_time_ms: float
    model_version: str = "BirdNET-Bioacoustic-v2.4"
    is_demo_fallback: bool = False


class SaveObservationFromAnalysis(BaseModel):
    survey_id: int
    species_id: Optional[int] = None
    species_name: Optional[str] = None
    device_id: Optional[int] = None
    observation_type: str  # image, audio
    count: int = 1
    confidence_score: float
    behavior_observed: Optional[str] = None
    notes: Optional[str] = None
    file_path: Optional[str] = None
    latitude: Optional[float] = None
    longitude: Optional[float] = None
    analysis_data: Optional[Dict[str, Any]] = None
