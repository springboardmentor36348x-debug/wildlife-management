from math import log
from collections import Counter

import pandas as pd
from sqlalchemy.orm import Session

from app.models.detection import Detection


def get_dataset_path():
    """
    Return the path of the wildlife population dataset.
    """

    from pathlib import Path

    project_folder = Path(__file__).resolve().parents[3]

    return (
        project_folder
        / "datasets"
        / "wildlife_population_data.csv"
    )


def calculate_species_diversity(df):
    """
    Calculate normalized Shannon diversity.

    A value of 100 means the observed species are very evenly
    distributed. Lower values indicate that observations are
    concentrated among fewer species.
    """

    species_counts = (
        df["scientific_name"]
        .dropna()
        .astype(str)
        .value_counts()
    )

    species_count = len(species_counts)

    if species_count <= 1:
        return 0.0

    total = species_counts.sum()

    shannon_index = 0.0

    for count in species_counts:
        proportion = count / total

        if proportion > 0:
            shannon_index -= proportion * log(proportion)

    maximum_diversity = log(species_count)

    if maximum_diversity == 0:
        return 0.0

    score = (
        shannon_index / maximum_diversity
    ) * 100

    return round(score, 2)


def calculate_population_stability(df):
    """
    Calculate population stability from monthly observation counts.

    The calculation uses the coefficient of variation:

        CV = standard deviation / mean

    The stability score is:

        (1 - CV) * 100

    Higher stability produces a higher score.
    """

    if "observed_on" not in df.columns:
        return None

    dates = pd.to_datetime(
        df["observed_on"],
        errors="coerce"
    )

    valid_dates = dates.dropna()

    if len(valid_dates) == 0:
        return None

    monthly_counts = (
        valid_dates
        .dt.to_period("M")
        .value_counts()
        .sort_index()
    )

    if len(monthly_counts) < 2:
        return None

    mean_count = monthly_counts.mean()

    if mean_count == 0:
        return None

    standard_deviation = monthly_counts.std()

    coefficient_of_variation = (
        standard_deviation / mean_count
    )

    score = (
        1 - coefficient_of_variation
    ) * 100

    score = max(0, min(score, 100))

    return round(score, 2)


def get_ecosystem_health(db: Session):

    # =====================================================
    # 1. LOAD WILDLIFE DATASET
    # =====================================================

    dataset_path = get_dataset_path()

    try:
        wildlife_df = pd.read_csv(dataset_path)
    except Exception as error:
        return {
            "overall_score": None,
            "score_type": "unavailable",
            "factors": {},
            "message": (
                f"Unable to load wildlife population dataset: {error}"
            )
        }

    # =====================================================
    # 2. BASIC DATA INFORMATION
    # =====================================================

    total_observations = len(wildlife_df)

    species_richness = int(
        wildlife_df["scientific_name"]
        .dropna()
        .nunique()
    )

    # =====================================================
    # 3. PROJECT-DEFINED WEIGHTS
    # =====================================================

    weights = {
        "species_diversity": 30,
        "population_stability": 25,
        "habitat_quality": 20,
        "endangered_species_status": 15,
        "environmental_conditions": 10
    }

    # =====================================================
    # 4. SPECIES DIVERSITY
    # =====================================================

    species_diversity_score = calculate_species_diversity(
        wildlife_df
    )

    # =====================================================
    # 5. POPULATION STABILITY
    # =====================================================

    population_stability_score = calculate_population_stability(
        wildlife_df
    )

    # =====================================================
    # 6. UNAVAILABLE DATA
    #
    # The current project datasets do not contain verified
    # habitat-quality, endangered-status or environmental
    # measurements.
    # =====================================================

    habitat_quality_score = None

    endangered_species_score = None

    environmental_conditions_score = None

    # =====================================================
    # 7. FACTORS
    # =====================================================

    factors = {

        "species_diversity": {
            "weight": weights["species_diversity"],
            "score": species_diversity_score,
            "available": species_diversity_score is not None,
            "data_source": "wildlife_population_data.csv",
            "species_richness": species_richness,
            "total_observations": total_observations
        },

        "population_stability": {
            "weight": weights["population_stability"],
            "score": population_stability_score,
            "available": population_stability_score is not None,
            "data_source": "wildlife_population_data.csv",
            "calculation": "Monthly observation-count stability"
        },

        "habitat_quality": {
            "weight": weights["habitat_quality"],
            "score": habitat_quality_score,
            "available": False,
            "data_source": None,
            "reason": (
                "No verified habitat-quality measurements are "
                "available in the current project datasets."
            )
        },

        "endangered_species_status": {
            "weight": weights["endangered_species_status"],
            "score": endangered_species_score,
            "available": False,
            "data_source": None,
            "reason": (
                "No verified endangered or conservation-status "
                "field is available in the current project datasets."
            )
        },

        "environmental_conditions": {
            "weight": weights["environmental_conditions"],
            "score": environmental_conditions_score,
            "available": False,
            "data_source": None,
            "reason": (
                "No environmental measurements such as temperature, "
                "rainfall or humidity are available in the current "
                "project datasets."
            )
        }
    }

    # =====================================================
    # 8. CALCULATE WEIGHTED SCORE FROM AVAILABLE FACTORS
    # =====================================================

    available_factors = [
        factor
        for factor in factors.values()
        if factor["score"] is not None
    ]

    overall_score = None

    if available_factors:

        available_weight = sum(
            factor["weight"]
            for factor in available_factors
        )

        weighted_total = sum(
            factor["score"] * factor["weight"]
            for factor in available_factors
        )

        overall_score = round(
            weighted_total / available_weight,
            2
        )

    # =====================================================
    # 9. DETERMINE SCORE TYPE
    # =====================================================

    all_factors_available = all(
        factor["score"] is not None
        for factor in factors.values()
    )

    if all_factors_available:
        score_type = "complete"
    elif available_factors:
        score_type = "partial"
    else:
        score_type = "unavailable"

    # =====================================================
    # 10. RESPONSE
    # =====================================================

    if score_type == "partial":

        message = (
            "The displayed ecosystem score is a partial weighted "
            "score based only on the assessment factors for which "
            "real project data is currently available. Habitat "
            "quality, endangered species status and environmental "
            "conditions require additional verified datasets."
        )

    elif score_type == "complete":

        message = (
            "The ecosystem health score is calculated using all "
            "five project-defined assessment factors and their "
            "corresponding weights."
        )

    else:

        message = (
            "Ecosystem health cannot be calculated because the "
            "required assessment data is not available."
        )

    return {

        "overall_score": overall_score,

        "score_type": score_type,

        "available_weight": sum(
            factor["weight"]
            for factor in available_factors
        ),

        "total_weight": sum(weights.values()),

        "factors": factors,

        "dataset": {
            "total_observations": total_observations,
            "species_richness": species_richness
        },

        "message": message
    }