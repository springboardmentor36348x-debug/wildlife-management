from pydantic import BaseModel, Field
from typing import List, Optional, Dict, Any
from datetime import datetime
from enum import Enum


# -------------------------------------------------------------
# 1. Population Estimation Schemas
# -------------------------------------------------------------
class PopulationTrendPoint(BaseModel):
    month: str
    year: int
    estimated_count: int
    sightings: int


class RegionalPopulation(BaseModel):
    region: str
    site_id: int
    estimated_count: int
    density_per_sq_km: float
    habitat_type: str


class SpeciesPopulationSummary(BaseModel):
    species_name: str
    total_sightings: int
    estimated_population: int
    density_per_sq_km: float
    growth_rate_pct: float
    trend_status: str  # "Increasing", "Stable", "Declining"
    iucn_status: str   # "Critically Endangered", "Endangered", "Vulnerable", "Near Threatened", "Least Concern"


class PopulationOverviewResponse(BaseModel):
    total_population_estimate: int
    estimated_growth_pct: float
    total_species_monitored: int
    total_survey_areas: int
    trends: List[PopulationTrendPoint]
    regional_breakdown: List[RegionalPopulation]
    species_summaries: List[SpeciesPopulationSummary]


# -------------------------------------------------------------
# 2. Habitat Intelligence Schemas
# -------------------------------------------------------------
class HabitatQualityScore(BaseModel):
    site_id: int
    site_name: str
    location: str
    habitat_type: str
    quality_score: float  # 0 to 100
    status: str           # "Optimal", "Moderate", "Degraded", "Critical"
    canopy_cover_pct: float
    water_availability_score: float
    human_disturbance_index: float
    last_assessed: datetime


class HabitatDegradationAlert(BaseModel):
    id: str
    site_id: int
    site_name: str
    severity: str        # "Critical", "High", "Medium", "Low"
    issue: str
    recommended_action: str
    timestamp: datetime


class HabitatDistributionItem(BaseModel):
    habitat: str
    site_count: int
    total_observations: int
    percentage: float


class HabitatIntelligenceResponse(BaseModel):
    average_habitat_score: float
    degraded_sites_count: int
    optimal_sites_count: int
    habitat_breakdown: List[HabitatDistributionItem]
    site_scores: List[HabitatQualityScore]
    alerts: List[HabitatDegradationAlert]


# -------------------------------------------------------------
# 3. Conservation Recommendation Schemas
# -------------------------------------------------------------
class ConservationPriority(str, Enum):
    urgent = "Urgent"
    high = "High"
    medium = "Medium"
    routine = "Routine"


class ConservationRecommendation(BaseModel):
    id: str
    title: str
    species_target: Optional[str] = None
    site_target: Optional[str] = None
    priority: ConservationPriority
    urgency_score: float
    category: str        # "Anti-Poaching", "Habitat Restoration", "Corridor Protection", "Sensor Deployment"
    description: str
    suggested_actions: List[str]
    created_at: datetime
    status: str = "Pending"  # "Pending", "In Progress", "Completed"


class ConservationOverviewResponse(BaseModel):
    total_recommendations: int
    urgent_actions_count: int
    threatened_species_count: int
    protected_areas_active: int
    recommendations: List[ConservationRecommendation]


# -------------------------------------------------------------
# 4. Ecosystem Health & Biodiversity Schemas
# -------------------------------------------------------------
class SpeciesOccurrenceRecord(BaseModel):
    id: int
    species: str
    latin_name: Optional[str] = None
    location: str
    date: str
    status: str
    confidence_score: Optional[float] = None
    detection_source: str


class BiodiversityMetrics(BaseModel):
    total_species: int
    species_richness: int
    shannon_diversity_index: float
    simpsons_diversity_index: float
    endemic_species_count: int
    threatened_species_count: int
    protected_areas_count: int
    ecosystem_health_score: float   # 0 to 100
    ecosystem_health_grade: str    # "Excellent", "Good", "Moderate", "Degraded"
    species_distribution: List[Dict[str, Any]]
    recent_occurrences: List[SpeciesOccurrenceRecord]
