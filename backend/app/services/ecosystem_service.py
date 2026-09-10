from math import log
from collections import Counter

from sqlalchemy.orm import Session

from app.models.detection import Detection


def get_ecosystem_health(db: Session):

    detections = (
        db.query(Detection)
        .filter(Detection.animal.isnot(None))
        .all()
    )

    total_detections = len(detections)

    # Count actual detections for each species
    species_counts = Counter()

    for detection in detections:
        if detection.animal:
            species_counts[detection.animal] += 1

    species_richness = len(species_counts)

    # Project-defined weights
    weights = {
        "species_diversity": 30,
        "population_stability": 25,
        "habitat_quality": 20,
        "endangered_species_status": 15,
        "environmental_conditions": 10
    }

    # ---------------------------------------------------------
    # Species Diversity Score
    # Uses Shannon diversity calculated from actual detections.
    # ---------------------------------------------------------

    species_diversity_score = None

    if species_richness > 1 and total_detections > 0:

        shannon_index = 0.0

        for count in species_counts.values():
            proportion = count / total_detections

            if proportion > 0:
                shannon_index -= proportion * log(proportion)

        maximum_diversity = log(species_richness)

        if maximum_diversity > 0:
            species_diversity_score = round(
                (shannon_index / maximum_diversity) * 100,
                2
            )

    elif species_richness == 1:
        species_diversity_score = 0.0

    # ---------------------------------------------------------
    # Other factors require their corresponding real data.
    # Do not assign artificial scores.
    # ---------------------------------------------------------

    population_stability_score = None
    habitat_quality_score = None
    endangered_species_score = None
    environmental_conditions_score = None

    factors = {
        "species_diversity": {
            "weight": weights["species_diversity"],
            "score": species_diversity_score,
            "available": species_diversity_score is not None,
            "species_richness": species_richness,
            "total_detections": total_detections
        },

        "population_stability": {
            "weight": weights["population_stability"],
            "score": population_stability_score,
            "available": False
        },

        "habitat_quality": {
            "weight": weights["habitat_quality"],
            "score": habitat_quality_score,
            "available": False
        },

        "endangered_species_status": {
            "weight": weights["endangered_species_status"],
            "score": endangered_species_score,
            "available": False
        },

        "environmental_conditions": {
            "weight": weights["environmental_conditions"],
            "score": environmental_conditions_score,
            "available": False
        }
    }

    # ---------------------------------------------------------
    # Overall score
    # Only calculate when all required factors are available.
    # ---------------------------------------------------------

    all_scores_available = all(
        factor["score"] is not None
        for factor in factors.values()
    )

    overall_score = None

    if all_scores_available:

        overall_score = round(
            sum(
                factor["score"] * factor["weight"]
                for factor in factors.values()
            ) / sum(weights.values()),
            2
        )

    return {
        "overall_score": overall_score,

        "factors": factors,

        "message": (
            "Species diversity is calculated from actual wildlife "
            "detection records using normalized Shannon diversity. "
            "The overall ecosystem health score will be calculated "
            "when all required assessment factors have valid data."
        )
    }