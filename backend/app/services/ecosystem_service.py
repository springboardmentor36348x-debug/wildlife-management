from sqlalchemy.orm import Session

from app.models.detection import Detection


def get_ecosystem_health(db: Session):

    detections = (
        db.query(Detection)
        .filter(Detection.animal.isnot(None))
        .all()
    )

    total_detections = len(detections)

    species = set()

    for detection in detections:
        if detection.animal:
            species.add(detection.animal)

    species_richness = len(species)

    # Project-defined weights
    weights = {
        "species_diversity": 30,
        "population_stability": 25,
        "habitat_quality": 20,
        "endangered_species_status": 15,
        "environmental_conditions": 10
    }

    # Calculate species diversity score from actual detection data
    if species_richness > 0:
        species_diversity_score = min(species_richness * 10, 100)
    else:
        species_diversity_score = 0

    # Other factors are not available yet
    population_stability_score = None
    habitat_quality_score = None
    endangered_species_score = None
    environmental_conditions_score = None

    factors = {
        "species_diversity": {
            "weight": weights["species_diversity"],
            "score": species_diversity_score,
            "available": total_detections > 0,
            "species_richness": species_richness
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

    # Calculate overall score using only available factors
    available_factors = [
        factor for factor in factors.values()
        if factor["score"] is not None
    ]

    if available_factors:
        total_weight = sum(
            factor["weight"] for factor in available_factors
        )

        weighted_score = sum(
            factor["score"] * factor["weight"]
            for factor in available_factors
        )

        overall_score = round(weighted_score / total_weight, 2)
    else:
        overall_score = None

    return {
        "overall_score": overall_score,

        "factors": factors,

        "message": (
            "Overall health score is calculated from the currently "
            "available ecosystem data. Additional population, habitat, "
            "conservation and environmental data can be included when available."
        )
    }