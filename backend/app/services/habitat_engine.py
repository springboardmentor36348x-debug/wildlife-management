"""
Habitat Intelligence Engine (Milestone 3, spec section 8).

HONEST LIMITATION (read before trusting these numbers): the original project
spec names Sentinel Hub / Google Earth Engine as the intended data sources
for real vegetation and habitat degradation analysis (NDVI time series from
satellite imagery). This platform does not have a live satellite data
integration yet - that's a real, unfinished piece of work, not something
this engine quietly solves.

What this engine actually does: it computes habitat proxy scores from data
already in the platform - habitat type, recent biodiversity trend, and
population stability - as a placeholder that keeps the Biodiversity
Intelligence Engine's habitat_quality_score input meaningful (previously a
hardcoded 70.0 default) until real remote-sensing data is wired in. Treat
these scores as a structural placeholder with a documented replacement path,
not as validated environmental science.
"""
from __future__ import annotations

from typing import List, Optional

from app.models.survey import HabitatType
from app.models.biodiversity import BiodiversityAssessment

# Baseline vegetation/suitability priors by habitat type - illustrative,
# not derived from real remote-sensing data. A real implementation would
# replace this whole module with NDVI/EVI time series analysis.
_HABITAT_BASELINE = {
    HabitatType.FOREST: {"vegetation": 82, "suitability": 85},
    HabitatType.GRASSLAND: {"vegetation": 60, "suitability": 70},
    HabitatType.WETLAND: {"vegetation": 75, "suitability": 80},
    HabitatType.RIVERINE: {"vegetation": 70, "suitability": 78},
    HabitatType.MOUNTAIN: {"vegetation": 55, "suitability": 60},
    HabitatType.COASTAL: {"vegetation": 58, "suitability": 65},
    HabitatType.OTHER: {"vegetation": 50, "suitability": 50},
}


def assess_habitat(
    habitat_type: HabitatType,
    recent_biodiversity_assessments: List[BiodiversityAssessment],
) -> dict:
    """
    Computes a HabitatAssessment-shaped dict for one monitoring site.

    recent_biodiversity_assessments: the site's BiodiversityAssessment
    history (most recent first), used as a trend signal for degradation risk
    - a declining ecosystem health score over successive assessments is
    treated as a proxy for habitat degradation, in the absence of real
    vegetation imagery.
    """
    baseline = _HABITAT_BASELINE.get(habitat_type, _HABITAT_BASELINE[HabitatType.OTHER])
    vegetation_index = float(baseline["vegetation"])
    suitability = float(baseline["suitability"])

    degradation_risk = 20.0  # neutral-low default when there's no trend data yet
    if len(recent_biodiversity_assessments) >= 2:
        latest = recent_biodiversity_assessments[0].overall_ecosystem_health_score
        previous = recent_biodiversity_assessments[1].overall_ecosystem_health_score
        delta = latest - previous
        if delta < -10:
            degradation_risk = 75.0
        elif delta < 0:
            degradation_risk = 50.0
        elif delta < 10:
            degradation_risk = 25.0
        else:
            degradation_risk = 10.0
        # A declining trend also drags down the vegetation/suitability proxy
        # slightly, so the numbers move together rather than existing in
        # isolation of the biodiversity signal.
        if delta < 0:
            vegetation_index = max(0.0, vegetation_index + delta * 0.5)
            suitability = max(0.0, suitability + delta * 0.5)

    if degradation_risk >= 65:
        status_label = "degrading"
    elif degradation_risk >= 40:
        status_label = "at_risk"
    else:
        status_label = "stable"

    # habitat_quality_score feeds directly into the Biodiversity Intelligence
    # Engine's weighted score (see biodiversity_engine.py) - blend vegetation
    # and suitability so it reflects both "is there good habitat" and
    # "is it degrading".
    habitat_quality_score = round((vegetation_index * 0.5 + suitability * 0.5) - (degradation_risk * 0.2), 2)
    habitat_quality_score = max(0.0, min(100.0, habitat_quality_score))

    return {
        "vegetation_index_proxy": round(vegetation_index, 2),
        "degradation_risk_score": round(degradation_risk, 2),
        "habitat_suitability_score": round(suitability, 2),
        "habitat_quality_score": habitat_quality_score,
        "degradation_status_label": status_label,
    }
