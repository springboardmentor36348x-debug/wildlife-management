import uuid
from datetime import datetime
from sqlalchemy import Column, String, Float, Boolean, DateTime, ForeignKey
from app.database import Base


class SpeciesPrediction(Base):
    __tablename__ = "species_predictions"

    id = Column(String, primary_key=True, default=lambda: str(uuid.uuid4()))
    monitoring_site_id = Column(String, ForeignKey("monitoring_sites.id"), nullable=True)
    camera_trap_id = Column(String, ForeignKey("camera_traps.id"), nullable=True)
    file_path = Column(String(500), nullable=False)
    predicted_species = Column(String(200), nullable=False)
    confidence = Column(Float, nullable=False)
    taxonomic_group = Column(String(100), nullable=True)
    conservation_status = Column(String(50), nullable=True)
    is_endangered = Column(Boolean, default=False)
    model_name = Column(String(100), default="wildlife-cnn-v1")
    created_at = Column(DateTime, default=datetime.utcnow)
    created_by = Column(String, ForeignKey("users.id"), nullable=True)