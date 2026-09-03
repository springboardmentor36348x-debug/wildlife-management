"""
Biodiversity Intelligence Engine (Milestone 2, spec section 4.7)
+ Wildlife Health Scoring Engine weighted model (spec section 4.10):

    Ecosystem Health Score =
        Species Diversity        (30%)
      + Population Stability     (25%)
      + Habitat Quality          (20%)
      + Endangered Species Status(15%)
      + Environmental Conditions (10%)

All sub-scores are normalized to a 0-100 scale before weighting.
"""
from __future__ import annotations

import math
from collections import Counter
from typing import List

from app.models.observation import SpeciesObservation, ConservationStatus

# Weighted scoring model straight from the project spec
WEIGHTS = {
    "species_diversity": 0.30,
    "population_stability": 0.25,
    "habitat_quality": 0.20,
    "endangered_species": 0.15,
    "environmental_conditions": 0.10,
}

_ENDANGERED_PENALTY = {
    ConservationStatus.LEAST_CONCERN: 0,
    ConservationStatus.NEAR_THREATENED: 10,
    ConservationStatus.VULNERABLE: 25,
    ConservationStatus.ENDANGERED: 45,
    ConservationStatus.CRITICALLY_ENDANGERED: 65,
    ConservationStatus.UNKNOWN: 5,
}


def shannon_index(counts: List[int]) -> float:
    """Shannon diversity index (H')."""
    total = sum(counts)
    if total == 0:
        return 0.0
    proportions = [c / total for c in counts if c > 0]
    return round(-sum(p * math.log(p) for p in proportions), 4)


def simpson_index(counts: List[int]) -> float:
    """Simpson diversity index (1-D form, higher = more diverse)."""
    total = sum(counts)
    if total <= 1:
        return 0.0
    numerator = sum(c * (c - 1) for c in counts)
    denominator = total * (total - 1)
    return round(1 - (numerator / denominator), 4)


def _score_species_diversity(species_counts: Counter) -> float:
    richness = len(species_counts)
    shannon = shannon_index(list(species_counts.values()))
    # Normalize: richness capped at 20 species, shannon capped at ~3.0 for scoring purposes
    richness_component = min(richness / 20, 1.0) * 100
    shannon_component = min(shannon / 3.0, 1.0) * 100
    return round(0.5 * richness_component + 0.5 * shannon_component, 2)


def _score_population_stability(observations_over_time: List[SpeciesObservation]) -> float:
    """
    Approximate stability using variance of per-species detection counts
    across the observation set. Lower variance -> higher stability score.
    A production version would compare successive survey periods (trend analysis).
    """
    if not observations_over_time:
        return 50.0  # neutral / insufficient data
    counts = Counter(o.species_common_name for o in observations_over_time)
    values = list(counts.values())
    mean = sum(values) / len(values)
    variance = sum((v - mean) ** 2 for v in values) / len(values)
    # Lower relative variance -> higher stability score (capped 0-100)
    stability = max(0.0, 100 - (variance / (mean + 1e-6)) * 20)
    return round(min(stability, 100.0), 2)


def _score_endangered_species(observations: List[SpeciesObservation]) -> float:
    """Higher penalty (lower score) as more endangered/critical species are found declining or threatened."""
    if not observations:
        return 100.0
    penalties = [_ENDANGERED_PENALTY.get(o.conservation_status, 5) for o in observations]
    avg_penalty = sum(penalties) / len(penalties)
    score = max(0.0, 100 - avg_penalty)
    return round(score, 2)


def compute_biodiversity_assessment(
    observations: List[SpeciesObservation],
    habitat_quality_score: float = 70.0,
    environmental_conditions_score: float = 70.0,
) -> dict:
    """
    Core function used by the /biodiversity endpoints.
    habitat_quality_score is now sourced from the Habitat Intelligence Engine
    (Milestone 3, see habitat_engine.py) when available - the biodiversity
    router fetches the site's latest HabitatAssessment and passes its score
    here. environmental_conditions_score still defaults to 70.0 pending real
    weather/environmental sensor integration (not yet built). The 70.0
    defaults below remain as a fallback for sites with no habitat assessment
    yet, not as the primary path anymore.
    are wired up in Milestone 3.
    """
    species_counts = Counter(o.species_common_name for o in observations)

    species_diversity_score = _score_species_diversity(species_counts)
    population_stability_score = _score_population_stability(observations)
    endangered_species_score = _score_endangered_species(observations)

    overall_score = (
        species_diversity_score * WEIGHTS["species_diversity"]
        + population_stability_score * WEIGHTS["population_stability"]
        + habitat_quality_score * WEIGHTS["habitat_quality"]
        + endangered_species_score * WEIGHTS["endangered_species"]
        + environmental_conditions_score * WEIGHTS["environmental_conditions"]
    )
    overall_score = round(overall_score, 2)

    if overall_score >= 85:
        label = "Excellent"
    elif overall_score >= 70:
        label = "Healthy"
    elif overall_score >= 50:
        label = "Moderate Concern"
    elif overall_score >= 30:
        label = "Vulnerable"
    else:
        label = "Critical"

    return {
        "species_richness": float(len(species_counts)),
        "shannon_diversity_index": shannon_index(list(species_counts.values())),
        "simpson_diversity_index": simpson_index(list(species_counts.values())),
        "species_diversity_score": species_diversity_score,
        "population_stability_score": population_stability_score,
        "habitat_quality_score": habitat_quality_score,
        "endangered_species_score": endangered_species_score,
        "environmental_conditions_score": environmental_conditions_score,
        "overall_ecosystem_health_score": overall_score,
        "conservation_status_label": label,
    }
