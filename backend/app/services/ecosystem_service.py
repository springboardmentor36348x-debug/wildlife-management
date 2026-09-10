from sqlalchemy.orm import Session

from app.models.detection import Detection


def get_ecosystem_health(db: Session):

    # Get actual wildlife detection records
    detections = (
        db.query(Detection)
        .filter(Detection.animal.isnot(None))
        .all()
    )

    total_detections = len(detections)

    # Get unique species from actual detection records
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

    # ---------------------------------------------------------
    # Current factor scores
    #
    # Only calculate a score when the required real data and
    # calculation method are available.
    # ---------------------------------------------------------

    species_diversity_score = None
    population_stability_score = None
    habitat_quality_score = None
    endangered_species_score = None
    environmental_conditions_score = None

    factors = {

        "species_diversity": {
            "weight": weights["species_diversity"],
            "score": species_diversity_score,
            "available": False,
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
    #
    # Do NOT calculate an overall score until all five
    # component scores are available.
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
            "The ecosystem health score requires valid data for "
            "species diversity, population stability, habitat quality, "
            "endangered species status and environmental conditions. "
            "The available wildlife detection data currently provides "
            "species richness and observation counts."
        )
    }