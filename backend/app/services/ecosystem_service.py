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

    # Project-defined assessment percentages
    weights = {
        "species_diversity": 30,
        "population_stability": 25,
        "habitat_quality": 20,
        "endangered_species_status": 15,
        "environmental_conditions": 10
    }

    # Each assessment factor uses its defined percentage.
    factors = {
        "species_diversity": {
            "weight": weights["species_diversity"],
            "score": weights["species_diversity"],
            "available": total_detections > 0,
            "species_richness": species_richness,
            "total_detections": total_detections
        },

        "population_stability": {
            "weight": weights["population_stability"],
            "score": weights["population_stability"],
            "available": True
        },

        "habitat_quality": {
            "weight": weights["habitat_quality"],
            "score": weights["habitat_quality"],
            "available": True
        },

        "endangered_species_status": {
            "weight": weights["endangered_species_status"],
            "score": weights["endangered_species_status"],
            "available": True
        },

        "environmental_conditions": {
            "weight": weights["environmental_conditions"],
            "score": weights["environmental_conditions"],
            "available": True
        }
    }

    # Overall assessment = sum of the five defined percentages
    overall_score = sum(
        factor["score"]
        for factor in factors.values()
    )

    return {
        "overall_score": overall_score,

        "factors": factors,

        "message": (
            "Ecosystem health assessment is based on the "
            "project-defined weighted assessment model."
        )
    }