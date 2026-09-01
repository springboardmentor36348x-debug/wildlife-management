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
        species.add(detection.animal)

    species_richness = len(species)

    # The project-defined weights
    weights = {
        "species_diversity": 30,
        "population_stability": 25,
        "habitat_quality": 20,
        "endangered_species_status": 15,
        "environmental_conditions": 10
    }

    return {
        "overall_score": None,

        "factors": {
            "species_diversity": {
                "weight": weights["species_diversity"],
                "score": None,
                "available": total_detections > 0,
                "species_richness": species_richness
            },

            "population_stability": {
                "weight": weights["population_stability"],
                "score": None,
                "available": False
            },

            "habitat_quality": {
                "weight": weights["habitat_quality"],
                "score": None,
                "available": False
            },

            "endangered_species_status": {
                "weight": weights["endangered_species_status"],
                "score": None,
                "available": False
            },

            "environmental_conditions": {
                "weight": weights["environmental_conditions"],
                "score": None,
                "available": False
            }
        },

        "message": (
            "Additional ecosystem data is required to calculate "
            "the complete health score."
        )
    }