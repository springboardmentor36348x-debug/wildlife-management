import uuid
from datetime import datetime

from sqlalchemy import Column, String, DateTime, Float, ForeignKey
from app.db_types import GUID
from sqlalchemy.orm import relationship

from app.database import Base


class PopulationEstimate(Base):
    """
    Population Estimation Engine output (Milestone 3, spec section 6).
    One row per species per monitoring site per assessment run.

    HONEST LIMITATION: true population density/growth-rate estimation in
    field ecology normally requires mark-recapture data, distance sampling,
    or multi-visit occupancy modelling - none of which this platform
    collects yet. The estimates here are derived from observation counts
    already in the database (a defensible first-order proxy: more
    individuals observed per unit effort suggests a larger local population)
    and are clearly weaker than a proper statistical estimator. See
    app/services/population_engine.py module docstring for the exact
    formulas and their limitations.
    """
    __tablename__ = "population_estimates"

    id = Column(GUID(), primary_key=True, default=uuid.uuid4)
    monitoring_site_id = Column(GUID(), ForeignKey("monitoring_sites.id"), nullable=False)

    species_common_name = Column(String(150), nullable=False)
    species_scientific_name = Column(String(150), nullable=True)

    estimated_population_size = Column(Float, default=0.0)   # sum of individual_count observed
    population_density = Column(Float, nullable=True)        # per sq km, if site area is known
    growth_rate_percent = Column(Float, nullable=True)       # % change vs previous assessment
    trend_label = Column(String(30), default="insufficient_data")  # increasing/stable/declining/insufficient_data

    observation_count = Column(Float, default=0.0)  # number of distinct observation records used
    assessed_at = Column(DateTime, default=datetime.utcnow)

    monitoring_site = relationship("MonitoringSite")
