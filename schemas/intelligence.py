"""
Intelligence Schemas (Population, Biodiversity, Habitat, Ecosystem Health)
"""

from pydantic import BaseModel, Field
from typing import Optional, List, Dict, Any
from datetime import datetime


# Population Intelligence
class PopulationTrendPoint(BaseModel):
    date: str
    count: int
    estimate: int
    density: float


class SpeciesPopulationSummary(BaseModel):
    species_id: int
    species_name: str
    scientific_name: str
    is_endangered: bool
    iucn_status: str
    total_observations: int
    estimated_population: int
    population_density: float  # individuals per km2
    growth_rate_pct: float
    trend: str  # increasing, stable, decreasing
    confidence_level: str  # high, medium, low
    historical_points: List[PopulationTrendPoint] = []


class SitePopulationOverview(BaseModel):
    site_id: int
    site_name: str
    total_individuals_estimated: int
    species_breakdown: List[SpeciesPopulationSummary] = []
    overall_density: float
    methodology_note: str = "Observation-based population estimate using spatio-temporal encounter rates."


# Biodiversity Intelligence
class BiodiversityMetrics(BaseModel):
    site_id: int
    site_name: str
    species_richness: int
    shannon_diversity_index: float
    simpson_diversity_index: float
    pielou_evenness: float
    total_observations: int
    biodiversity_score: float  # 0 to 100
    biodiversity_status: str  # Excellent, Good, Moderate, Poor
    species_group_distribution: Dict[str, int] = {}
    top_dominant_species: List[Dict[str, Any]] = []


# Habitat Intelligence
class HabitatAssessmentRequest(BaseModel):
    site_id: int
    vegetation_quality: float = Field(..., ge=0, le=100)
    water_availability: float = Field(..., ge=0, le=100)
    human_disturbance: float = Field(..., ge=0, le=100)
    canopy_cover_pct: Optional[float] = 75.0
    degradation_type: Optional[str] = "None"
    notes: Optional[str] = None


class HabitatAssessmentResponse(BaseModel):
    site_id: int
    site_name: str
    habitat_type: str
    assessment_date: datetime
    habitat_quality_score: float  # 0 to 100
    vegetation_score: float
    water_source_score: float
    human_disturbance_score: float
    degradation_level: str  # None, Low, Moderate, High
    degradation_type: str
    restoration_needed: bool
    suitability_index: float
    environmental_status: str


# Ecosystem Health Scoring (Official 5-Component Weighted Model)
class EcosystemHealthCalculation(BaseModel):
    site_id: int
    site_name: str
    species_diversity_score: float  # 30% weight
    population_stability_score: float  # 25% weight
    habitat_quality_score: float  # 20% weight
    endangered_species_score: float  # 15% weight
    environmental_conditions_score: float  # 10% weight
    overall_health_score: float
    health_status: str  # Excellent (90-100), Healthy (75-89), Moderate Concern (60-74), Vulnerable (40-59), Critical (0-39)
    weights: Dict[str, float] = {
        "species_diversity": 0.30,
        "population_stability": 0.25,
        "habitat_quality": 0.20,
        "endangered_species_status": 0.15,
        "environmental_conditions": 0.10
    }
    recommendations_count: int = 0
    assessment_date: datetime
