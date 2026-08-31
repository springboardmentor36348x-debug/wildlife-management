import uuid
from sqlalchemy import Column, String, DateTime, ForeignKey
from datetime import datetime
from app.database import Base


class Observation(Base):
    __tablename__ = "observations"

    id = Column(String, primary_key=True, default=lambda: str(uuid.uuid4()))
    monitoring_site_id = Column(String, ForeignKey("monitoring_sites.id"), nullable=False)
    camera_trap_id = Column(String, ForeignKey("camera_traps.id"), nullable=True)
    species_name = Column(String(200), nullable=False)
    observation_type = Column(String(50), nullable=False)  # image, audio, manual
    notes = Column(String(500), nullable=True)
    observed_at = Column(DateTime, default=datetime.utcnow)
    recorded_by = Column(String, ForeignKey("users.id"))