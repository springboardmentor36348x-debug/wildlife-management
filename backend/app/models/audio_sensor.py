import uuid
from sqlalchemy import Column, String, Float, Date, ForeignKey
from app.database import Base


class AudioSensor(Base):
    __tablename__ = "audio_sensors"

    id = Column(String, primary_key=True, default=lambda: str(uuid.uuid4()))
    monitoring_site_id = Column(String, ForeignKey("monitoring_sites.id"), nullable=False)
    device_code = Column(String(50), unique=True, nullable=False)
    model_name = Column(String(100), nullable=True)
    installation_date = Column(Date, nullable=False)
    status = Column(String(50), default="active")
    battery_level = Column(Float, default=100.0)