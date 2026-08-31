import uuid
from sqlalchemy import Column, String, Float, ForeignKey
from app.database import Base


class MonitoringSite(Base):
    __tablename__ = "monitoring_sites"

    id = Column(String, primary_key=True, default=lambda: str(uuid.uuid4()))
    survey_id = Column(String, ForeignKey("surveys.id"), nullable=False)
    site_name = Column(String(150), nullable=False)
    latitude = Column(Float, nullable=False)
    longitude = Column(Float, nullable=False)
    habitat_type = Column(String(100), nullable=False)
    protected_area = Column(String(150), nullable=True)
    monitoring_device = Column(String(100), nullable=True)