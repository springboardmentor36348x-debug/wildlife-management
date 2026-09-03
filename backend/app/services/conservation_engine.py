"""
Conservation Recommendation Engine (Milestone 3, spec section 9).

Deliberately rule-based rather than a trained ML model: conservation
recommendations get acted on by forest department staff and conservation
officers, so being able to explain *why* a recommendation was generated
(the `rationale` field) matters more here than squeezing out marginal
accuracy from a black-box model. Each rule below is intentionally simple
and auditable.

Reads the outputs of the Biodiversity, Population, and Habitat Intelligence
Engines and produces prioritized, actionable recommendations.
"""
from __future__ import annotations

from typing import List, Optional

from app.models.biodiversity import BiodiversityAssessment
from app.models.habitat import HabitatAssessment
from app.models.observation import ConservationStatus


def generate_recommendations(
    biodiversity: Optional[BiodiversityAssessment],
    habitat: Optional[HabitatAssessment],
    endangered_species_names: List[str],
    population_declining_species: List[str],
) -> List[dict]:
    """
    Returns a list of ConservationRecommendation-shaped dicts.
    Any of the inputs can be None/empty if that engine hasn't run yet for
    this site - the rules below degrade gracefully rather than requiring
    every upstream engine to have produced data first.
    """
    recommendations: List[dict] = []

    # --- Rule 1: endangered species presence -> protection priority ---
    if endangered_species_names:
        species_list = ", ".join(sorted(set(endangered_species_names)))
        recommendations.append({
            "priority": "critical",
            "category": "endangered_species_protection",
            "title": "Increase protection for endangered species observed at this site",
            "description": (
                f"Endangered or critically endangered species detected: {species_list}. "
                "Recommend prioritizing anti-poaching patrols and restricting human "
                "activity near confirmed sighting locations."
            ),
            "rationale": (
                "Triggered because one or more observations at this site have "
                "conservation_status in (endangered, critically_endangered)."
            ),
        })

    # --- Rule 2: overall ecosystem health -> patrol / resource allocation ---
    if biodiversity is not None:
        label = biodiversity.conservation_status_label
        if label in ("Vulnerable", "Critical"):
            recommendations.append({
                "priority": "high" if label == "Vulnerable" else "critical",
                "category": "resource_allocation",
                "title": f"Ecosystem health rated '{label}' - allocate additional monitoring resources",
                "description": (
                    f"The site's overall ecosystem health score is "
                    f"{biodiversity.overall_ecosystem_health_score:.1f}/100 ('{label}'). "
                    "Recommend increasing camera trap / audio sensor density and survey "
                    "frequency at this site to better track the cause of decline."
                ),
                "rationale": (
                    f"Triggered because conservation_status_label = '{label}' from the "
                    "Biodiversity Intelligence Engine's weighted score."
                ),
            })
        elif label in ("Excellent", "Healthy"):
            recommendations.append({
                "priority": "low",
                "category": "monitoring_optimization",
                "title": "Ecosystem health is strong - maintain current monitoring cadence",
                "description": (
                    f"Overall ecosystem health score is {biodiversity.overall_ecosystem_health_score:.1f}/100 "
                    f"('{label}'). Current monitoring levels appear sufficient; resources may be "
                    "reallocated to lower-scoring sites if capacity is constrained."
                ),
                "rationale": f"Triggered because conservation_status_label = '{label}'.",
            })

    # --- Rule 3: habitat degradation -> restoration priority ---
    if habitat is not None and habitat.degradation_status_label in ("at_risk", "degrading"):
        priority = "critical" if habitat.degradation_status_label == "degrading" else "high"
        recommendations.append({
            "priority": priority,
            "category": "habitat_restoration",
            "title": f"Habitat flagged as '{habitat.degradation_status_label}' - restoration action recommended",
            "description": (
                f"Degradation risk score is {habitat.degradation_risk_score:.1f}/100 with a "
                f"vegetation index proxy of {habitat.vegetation_index_proxy:.1f}/100. Recommend "
                "a field habitat survey to confirm degradation drivers (encroachment, "
                "invasive species, water stress) and plan restoration action."
            ),
            "rationale": (
                f"Triggered because degradation_status_label = '{habitat.degradation_status_label}' "
                "from the Habitat Intelligence Engine."
            ),
        })

    # --- Rule 4: declining species populations -> protection strategy ---
    if population_declining_species:
        species_list = ", ".join(sorted(set(population_declining_species)))
        recommendations.append({
            "priority": "high",
            "category": "endangered_species_protection",
            "title": "Investigate declining population trend for specific species",
            "description": (
                f"The following species show a declining population trend at this site: "
                f"{species_list}. Recommend a targeted field investigation to rule out "
                "poaching, habitat loss, or disease as drivers."
            ),
            "rationale": (
                "Triggered because one or more species have trend_label = 'declining' from "
                "the Population Estimation Engine."
            ),
        })

    # --- Fallback: nothing notable, but say so explicitly rather than
    # returning an empty list with no explanation ---
    if not recommendations:
        recommendations.append({
            "priority": "low",
            "category": "monitoring_optimization",
            "title": "No urgent issues detected - continue routine monitoring",
            "description": (
                "No endangered species, ecosystem health concerns, habitat degradation, or "
                "population decline signals were found for this site in the current data. "
                "Continue routine survey and monitoring cadence."
            ),
            "rationale": "Triggered because no other rule matched - this is the default state.",
        })

    return recommendations
