"""
Ecosystem Health Scoring Engine (Milestone 3, Feature E).

Implements the spec's exact weighted formula:

    Ecosystem Health Score =
        (Species Diversity Score        x 0.30) +
        (Population Stability Score     x 0.25) +
        (Habitat Quality Score          x 0.20) +
        (Endangered Species Status Score x 0.15) +
        (Environmental Conditions Score x 0.10)

Each component is a 0-100 score computed from real Feature B/C/D data.
See each function's docstring for the reasoning behind its score.

conservation_status thresholds (the spec names the 5 labels - Excellent,
Healthy, Moderate Concern, Vulnerable, Critical - but does not define
exact cutoffs, so we define and document them here):
    80+     Excellent
    65-79   Healthy
    50-64   Moderate Concern
    35-49   Vulnerable
    <35     Critical
"""
from sqlalchemy.orm import Session

from app.models.observation import Observation
from app.models.survey import MonitoringSite
from app.services import conservation_service, habitat_service, population_service

WEIGHTS = {
    "species_diversity": 0.30,
    "population_stability": 0.25,
    "habitat_quality": 0.20,
    "endangered_species_status": 0.15,
    "environmental_conditions": 0.10,
}

CONSERVATION_STATUS_THRESHOLDS = [
    (80, "Excellent"),
    (65, "Healthy"),
    (50, "Moderate Concern"),
    (35, "Vulnerable"),
    (0, "Critical"),
]


def _conservation_status(score: float) -> str:
    for threshold, label in CONSERVATION_STATUS_THRESHOLDS:
        if score >= threshold:
            return label
    return "Critical"


def _site_scope_observations(db: Session, site_id: str | None, survey_id: str | None) -> list[Observation]:
    query = db.query(Observation).filter(Observation.species_label.isnot(None))
    if site_id:
        query = query.filter(Observation.site_id == site_id)
    elif survey_id:
        query = query.join(MonitoringSite, Observation.site_id == MonitoringSite.id).filter(
            MonitoringSite.survey_id == survey_id
        )
    return query.all()


def _species_diversity_score(db: Session, observations: list[Observation]) -> dict:
    """
    Species richness (distinct species_label count) at the scoped
    site/survey, normalized against the max diversity seen across ALL
    sites in the system, capped at 100. A site that ties the
    system's most-diverse site scores 100; a site with no species yet
    scores 0.
    """
    local_richness = len({obs.species_label for obs in observations})

    all_sites = db.query(MonitoringSite).all()
    max_richness = 0
    for site in all_sites:
        richness = len({obs.species_label for obs in site.observations if obs.species_label})
        max_richness = max(max_richness, richness)

    if max_richness == 0:
        return {"score": 0, "note": "No species recorded anywhere in the system yet."}

    score = min(100, round((local_richness / max_richness) * 100))
    return {
        "score": score,
        "note": f"{local_richness} distinct species observed here, vs {max_richness} at the most diverse site in the system.",
    }


def _population_stability_score(db: Session, observations: list[Observation]) -> dict:
    """
    Derived from get_population_trend for each species present in scope:
    flat/increasing recent activity -> high score, sharply declining ->
    low score. With insufficient trend data (the common case in a fresh
    test system), defaults to a neutral 50 and says so explicitly rather
    than guessing.
    """
    species_in_scope = {obs.species_label for obs in observations if obs.species_label}
    if not species_in_scope:
        return {"score": 50, "note": "No species observed in scope - defaulting to neutral 50."}

    per_species_scores: list[int] = []
    for species in species_in_scope:
        trend = population_service.get_population_trend(db, species_label=species, window_days=30)
        if len(trend) < 2:
            per_species_scores.append(50)  # not enough buckets to call a direction
            continue
        first_half = trend[: len(trend) // 2]
        second_half = trend[len(trend) // 2 :]
        first_avg = sum(p["count"] for p in first_half) / max(len(first_half), 1)
        second_avg = sum(p["count"] for p in second_half) / max(len(second_half), 1)
        if first_avg == 0:
            per_species_scores.append(50 if second_avg == 0 else 80)
            continue
        change = (second_avg - first_avg) / first_avg
        if change >= 0:
            per_species_scores.append(min(100, 70 + round(change * 30)))
        else:
            per_species_scores.append(max(0, 70 + round(change * 70)))

    score = round(sum(per_species_scores) / len(per_species_scores))
    return {
        "score": score,
        "note": f"Averaged trend-derived stability across {len(species_in_scope)} species with recorded activity.",
    }


def _habitat_quality_score(db: Session, site_id: str | None, survey_id: str | None) -> dict:
    """
    Derived from detect_habitat_degradation per site in scope: "stable"
    contributes a high score, "declining" a low score, "insufficient_data"
    a neutral 50.
    """
    if site_id:
        site_ids = [site_id]
    else:
        query = db.query(MonitoringSite)
        if survey_id:
            query = query.filter(MonitoringSite.survey_id == survey_id)
        site_ids = [s.id for s in query.all()]

    if not site_ids:
        return {"score": 50, "note": "No monitoring sites in scope - defaulting to neutral 50."}

    site_scores: list[int] = []
    for sid in site_ids:
        degradation = habitat_service.detect_habitat_degradation(db, site_id=sid)
        if degradation["status"] == "declining":
            site_scores.append(20)
        elif degradation["status"] == "stable":
            site_scores.append(85)
        else:
            site_scores.append(50)

    score = round(sum(site_scores) / len(site_scores))
    return {"score": score, "note": f"Averaged habitat-degradation proxy across {len(site_ids)} site(s)."}


def _endangered_species_status_score(db: Session, observations: list[Observation]) -> dict:
    """
    Uses Feature D's rare/vulnerable species proxy. IMPORTANT DIRECTION:
    MORE rare-species-presence at a site LOWERS this score (more
    endangered-proxy species present = higher conservation risk = lower
    "status" score), the opposite of species_diversity_score above.
    """
    species_in_scope = {obs.species_label for obs in observations if obs.species_label}
    if not species_in_scope:
        return {"score": 100, "note": "No species observed in scope - no known endangered-proxy risk to report."}

    total_counts: dict[str, int] = {}
    for row in population_service.get_population_counts(db):
        total_counts[row["species"]] = row["count"]

    rare_count = sum(
        1 for species in species_in_scope
        if total_counts.get(species, 0) <= conservation_service.RARE_SPECIES_OBSERVATION_THRESHOLD
    )
    rare_fraction = rare_count / len(species_in_scope)
    # Higher rare_fraction -> lower score (higher risk).
    score = round(100 - (rare_fraction * 100))
    return {
        "score": score,
        "note": f"{rare_count} of {len(species_in_scope)} species in scope are rare-observation proxies "
        f"(<= {conservation_service.RARE_SPECIES_OBSERVATION_THRESHOLD} total observations system-wide). "
        "More rare-species presence lowers this score (higher conservation risk).",
    }


def _environmental_conditions_score() -> dict:
    """
    No real environmental sensor data source is connected (see Feature C's
    monitor_environmental_conditions -> "not_available"). Defaults to a
    neutral 50 with a clear note - this component will read from real
    sensor data once that integration exists, and will not be fabricated
    in the meantime.
    """
    return {
        "score": 50,
        "note": "No environmental sensor feed connected - defaulting to neutral 50 until real sensor data is available.",
    }


def calculate_ecosystem_health(db: Session, site_id: str | None = None, survey_id: str | None = None) -> dict:
    observations = _site_scope_observations(db, site_id, survey_id)

    diversity = _species_diversity_score(db, observations)
    stability = _population_stability_score(db, observations)
    habitat = _habitat_quality_score(db, site_id, survey_id)
    endangered = _endangered_species_status_score(db, observations)
    environmental = _environmental_conditions_score()

    weighted_score = (
        diversity["score"] * WEIGHTS["species_diversity"]
        + stability["score"] * WEIGHTS["population_stability"]
        + habitat["score"] * WEIGHTS["habitat_quality"]
        + endangered["score"] * WEIGHTS["endangered_species_status"]
        + environmental["score"] * WEIGHTS["environmental_conditions"]
    )
    weighted_score = round(weighted_score, 1)

    return {
        "site_id": site_id,
        "survey_id": survey_id,
        "components": {
            "species_diversity": {**diversity, "weight": WEIGHTS["species_diversity"]},
            "population_stability": {**stability, "weight": WEIGHTS["population_stability"]},
            "habitat_quality": {**habitat, "weight": WEIGHTS["habitat_quality"]},
            "endangered_species_status": {**endangered, "weight": WEIGHTS["endangered_species_status"]},
            "environmental_conditions": {**environmental, "weight": WEIGHTS["environmental_conditions"]},
        },
        "ecosystem_health_score": weighted_score,
        "conservation_status": _conservation_status(weighted_score),
    }


def calculate_ecosystem_health_all_sites(db: Session) -> list[dict]:
    sites = db.query(MonitoringSite).all()
    return [calculate_ecosystem_health(db, site_id=site.id) for site in sites]
