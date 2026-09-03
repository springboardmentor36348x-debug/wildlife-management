import uuid
from datetime import datetime

from sqlalchemy import Column, String, DateTime, Float, ForeignKey
from app.db_types import GUID
from sqlalchemy.orm import relationship

from app.database import Base


class HabitatAssessment(Base):
    """
    Habitat Intelligence Engine output (Milestone 3, spec section 8).

    HONEST LIMITATION: real habitat classification, degradation detection,
    and vegetation analysis normally come from satellite/remote-sensing data
    (e.g. NDVI from Sentinel Hub or Google Earth Engine, as named in the
    original project spec's tech stack). This platform doesn't have a live
    satellite data integration yet, so the scores here are computed from
    proxies already available in the database (habitat type, biodiversity
    trend, population stability) rather than actual imagery analysis. See
    app/services/habitat_engine.py module docstring for exact formulas and
    what a real integration would replace them with.
    """
    __tablename__ = "habitat_assessments"

    id = Column(GUID(), primary_key=True, default=uuid.uuid4)
    monitoring_site_id = Column(GUID(), ForeignKey("monitoring_sites.id"), nullable=False)

    vegetation_index_proxy = Column(Float, default=0.0)     # 0-100, proxy for NDVI-style vegetation health
    degradation_risk_score = Column(Float, default=0.0)     # 0-100, higher = more degradation risk
    habitat_suitability_score = Column(Float, default=0.0)  # 0-100, higher = more suitable for wildlife
    habitat_quality_score = Column(Float, default=70.0)     # 0-100, feeds Biodiversity Intelligence Engine

    degradation_status_label = Column(String(30), default="unknown")  # stable/at_risk/degrading/unknown
    assessed_at = Column(DateTime, default=datetime.utcnow)

    monitoring_site = relationship("MonitoringSite")
