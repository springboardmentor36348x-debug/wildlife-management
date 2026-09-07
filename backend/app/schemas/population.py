import uuid
from datetime import datetime
from typing import Optional

from pydantic import BaseModel, ConfigDict


class PopulationEstimateOut(BaseModel):
    model_config = ConfigDict(from_attributes=True)

    id: uuid.UUID
    monitoring_site_id: uuid.UUID
    species_common_name: str
    species_scientific_name: Optional[str] = None
    estimated_population_size: float
    population_density: Optional[float] = None
    growth_rate_percent: Optional[float] = None
    trend_label: str
    observation_count: float
    assessed_at: datetime


class SiteAreaInput(BaseModel):
    """Optional site area for density calculation - not stored on MonitoringSite
    since not every site knows its exact boundary; passed per-request instead."""
    area_sq_km: Optional[float] = None
