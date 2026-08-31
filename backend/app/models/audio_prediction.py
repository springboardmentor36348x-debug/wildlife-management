import uuid
from datetime import datetime
from sqlalchemy import Column, String, Float, DateTime, ForeignKey, Boolean
from app.database import Base


class AudioPrediction(Base):
    """
    Stores the result of running the Bioacoustic Recognition Engine
    on a single uploaded audio recording (bird call, mammal vocalization, etc.)
    """
    __tablename__ = "audio_predictions"

    id = Column(String, primary_key=True, default=lambda: str(uuid.uuid4()))

    monitoring_site_id = Column(String, ForeignKey("monitoring_sites.id"), nullable=True)
    audio_sensor_id = Column(String, ForeignKey("audio_sensors.id"), nullable=True)

    file_path = Column(String(500), nullable=False)
    predicted_species = Column(String(200), nullable=False)
    confidence = Column(Float, nullable=False)
    call_type = Column(String(100), nullable=True)
    conservation_status = Column(String(50), nullable=True)
    is_endangered = Column(Boolean, default=False)

    model_name = Column(String(100), default="bioacoustic-rf-v1")
    created_at = Column(DateTime, default=datetime.utcnow)
    created_by = Column(String, ForeignKey("users.id"), nullable=True)