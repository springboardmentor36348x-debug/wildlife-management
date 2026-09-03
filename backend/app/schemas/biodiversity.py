import uuid
from datetime import datetime

from pydantic import BaseModel, ConfigDict


class BiodiversityAssessmentOut(BaseModel):
    model_config = ConfigDict(from_attributes=True)

    id: uuid.UUID
    monitoring_site_id: uuid.UUID
    species_richness: float
    shannon_diversity_index: float
    simpson_diversity_index: float
    species_diversity_score: float
    population_stability_score: float
    habitat_quality_score: float
    endangered_species_score: float
    environmental_conditions_score: float
    overall_ecosystem_health_score: float
    conservation_status_label: str
    assessed_at: datetime
