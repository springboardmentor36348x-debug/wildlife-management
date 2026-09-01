from sqlalchemy.orm import Session
from app.models.detection import Detection

import pandas as pd
from pathlib import Path


def get_conservation_recommendations(db: Session):

    # -------------------------------------------------
    # 1. APPLICATION DETECTION DATA
    # -------------------------------------------------

    detections = (
        db.query(Detection)
        .filter(Detection.animal.isnot(None))
        .all()
    )

    total_detections = len(detections)

    species_counts = {}

    for detection in detections:

        animal = detection.animal

        if animal not in species_counts:
            species_counts[animal] = 0

        species_counts[animal] += 1

    recommendations = []

    if total_detections == 0:

        recommendations.append({
            "animal": None,
            "type": "Monitoring",
            "recommendation": (
                "Continue collecting wildlife observations to support "
                "future conservation analysis."
            ),
            "detection_count": 0
        })

    else:

        # Identify species with the highest number of detections.
        for animal, count in species_counts.items():

            percentage = (count / total_detections) * 100

            if percentage >= 50:

                recommendations.append({
                    "animal": animal,
                    "type": "Monitoring Priority",
                    "recommendation": (
                        "Consider additional monitoring because this species "
                        "represents a large proportion of the recorded detections."
                    ),
                    "detection_count": count
                })

        if not recommendations:

            recommendations.append({
                "animal": None,
                "type": "Monitoring",
                "recommendation": (
                    "Continue collecting wildlife observations to support "
                    "future conservation analysis."
                ),
                "detection_count": total_detections
            })


    # -------------------------------------------------
    # 2. WILDLIFE OBSERVATION DATASET
    # -------------------------------------------------

    project_folder = Path(__file__).resolve().parents[3]

    dataset_path = (
        project_folder
        / "datasets"
        / "wildlife_population_data.csv"
    )

    wildlife_df = pd.read_csv(dataset_path)


    # Total observations
    wildlife_observations = len(wildlife_df)


    # Wildlife group counts
    wildlife_groups = (
        wildlife_df["iconic_taxon_name"]
        .value_counts()
        .to_dict()
    )


    # Number of unique species
    wildlife_species = int(
        wildlife_df["scientific_name"].nunique()
    )


    # Top observed species
    top_species_df = (
        wildlife_df["scientific_name"]
        .value_counts()
        .head(10)
        .reset_index()
    )

    top_species_df.columns = [
        "species",
        "observations"
    ]

    top_species = (
        top_species_df
        .to_dict(orient="records")
    )


    # -------------------------------------------------
    # 3. RETURN COMBINED INFORMATION
    # -------------------------------------------------

    return {

        # Existing application information
        "total_detections": total_detections,

        "recommendations": recommendations,


        # Wildlife dataset information
        "wildlife_dataset": {

            "total_observations": wildlife_observations,

            "species_count": wildlife_species,

            "groups": wildlife_groups,

            "top_species": top_species

        }

    }