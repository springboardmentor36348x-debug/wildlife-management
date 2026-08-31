"""
Ecosystem Health Analytics (Milestone 3)
--------------------------------------------
Combines Biodiversity, Population, and Habitat signals into a single
weighted Ecosystem Health Score, following the project spec's formula:

    Species Diversity (30%) + Population Stability (25%)
    + Habitat Quality (20%) + Endangered Species Status (15%)
    + Environmental Conditions (10%)

Environmental Conditions (weather/pollution sensor data) is not currently
ingested by this system, so its 10% weight is redistributed proportionally
across the four factors that do have real data, keeping the score honestly
computed from what is actually measured rather than using a placeholder.
"""
from typing import Optional

from sqlalchemy.orm import Session

from app.models.species_prediction import SpeciesPrediction
from app.models.audio_prediction import AudioPrediction
from app.services.biodiversity_service import calculate_biodiversity_index
from app.services.habitat_service import calculate_habitat_intelligence

# Original spec weights (Environmental Conditions excluded — no data source yet)
BASE_WEIGHTS = {
    "species_diversity": 0.30,
    "population_stability": 0.25,
    "habitat_quality": 0.20,
    "endangered_status": 0.15,
}
_WEIGHT_SUM = sum(BASE_WEIGHTS.values())  # 0.90
# Redistribute proportionally so the four available factors sum to 100%
WEIGHTS = {k: v / _WEIGHT_SUM for k, v in BASE_WEIGHTS.items()}


def _status_label(score: float) -> str:
    if score >= 80:
        return "Excellent"
    elif score >= 65:
        return "Healthy"
    elif score >= 50:
        return "Moderate Concern"
    elif score >= 30:
        return "Vulnerable"
    else:
        return "Critical"


def calculate_ecosystem_health(
    db: Session,
    researcher_id: Optional[str] = None,
):
    # Species Diversity — Shannon index scaled to 0-100 (max ~3.0 = 20+ evenly distributed species)
    biodiversity = calculate_biodiversity_index(db, researcher_id=researcher_id)
    diversity_score = min(100, round((biodiversity["shannon_index"] / 3.0) * 100, 1))

    # Habitat Quality + Population Stability — averaged across all sites
    habitat_data = calculate_habitat_intelligence(db, researcher_id)
    sites = habitat_data["sites"]
    if sites:
        habitat_quality_score = round(sum(s["habitat_health_score"] for s in sites) / len(sites), 1)
        population_stability_score = round(sum(s["stability_score"] for s in sites) / len(sites), 1)
    else:
        habitat_quality_score = 0.0
        population_stability_score = 0.0

    # Endangered Species Status — inverse of endangered detection ratio
    # (more endangered detections = lower ecosystem health score)
    image_query = db.query(SpeciesPrediction)
    audio_query = db.query(AudioPrediction)
    if researcher_id:
        image_query = image_query.filter(SpeciesPrediction.created_by == researcher_id)
        audio_query = audio_query.filter(AudioPrediction.created_by == researcher_id)

    image_predictions = image_query.all()
    audio_predictions = audio_query.all()
    total_detections = len(image_predictions) + len(audio_predictions)
    endangered_count = (
        sum(1 for p in image_predictions if p.is_endangered)
        + sum(1 for p in audio_predictions if p.is_endangered)
    )

    if total_detections > 0:
        endangered_ratio = endangered_count / total_detections
        # Score is inverted: 0% endangered -> 100 score, 50%+ endangered -> 0 score
        endangered_status_score = max(0, round(100 - (endangered_ratio * 200), 1))
    else:
        endangered_status_score = 100.0  # no data = no detected risk signal

    overall_score = round(
        diversity_score * WEIGHTS["species_diversity"]
        + population_stability_score * WEIGHTS["population_stability"]
        + habitat_quality_score * WEIGHTS["habitat_quality"]
        + endangered_status_score * WEIGHTS["endangered_status"],
        1,
    )

    return {
        "overall_score": overall_score,
        "status": _status_label(overall_score),
        "factors": {
            "species_diversity": {
                "score": diversity_score,
                "weight_pct": round(WEIGHTS["species_diversity"] * 100, 1),
            },
            "population_stability": {
                "score": population_stability_score,
                "weight_pct": round(WEIGHTS["population_stability"] * 100, 1),
            },
            "habitat_quality": {
                "score": habitat_quality_score,
                "weight_pct": round(WEIGHTS["habitat_quality"] * 100, 1),
            },
            "endangered_status": {
                "score": endangered_status_score,
                "weight_pct": round(WEIGHTS["endangered_status"] * 100, 1),
            },
        },
        "note": (
            "Environmental Conditions (10% in the original spec) is not yet "
            "tracked by this system — its weight has been redistributed "
            "proportionally across the four measured factors above."
        ),
        "endangered_detections": endangered_count,
        "total_detections": total_detections,
    }