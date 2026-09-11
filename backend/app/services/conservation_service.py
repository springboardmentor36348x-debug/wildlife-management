"""
Conservation Recommendation Engine (Milestone 3, Feature D).

Consumes Feature B (population) and Feature C (habitat) data to generate
RULE-BASED recommendations - not ML. A real ML recommendation model would
need historical conservation-outcome training data (e.g. "site X got
intervention Y, population recovered by Z%") which does not exist here.
Every recommendation returned is a templated string chosen by a concrete,
inspectable rule, not AI-generated prose.
"""
from sqlalchemy.orm import Session

from app.models.observation import Observation
from app.models.survey import MonitoringSite
from app.services import habitat_service, population_service

# An observation's species is treated as "rare/vulnerable" at a site if it
# has 2 or fewer total observations system-wide. This is a naive proxy for
# real IUCN Red List / conservation status data, which is not connected.
RARE_SPECIES_OBSERVATION_THRESHOLD = 2


def _species_total_counts(db: Session) -> dict[str, int]:
    counts: dict[str, int] = {}
    for row in population_service.get_population_counts(db):
        counts[row["species"]] = row["count"]
    return counts


def get_conservation_priorities(db: Session) -> list[dict]:
    """
    Ranks every monitoring site by a combined risk score: low recorded
    species count + a "declining" habitat-degradation flag = higher
    priority. priority is "high" / "medium" / "low".
    """
    sites = db.query(MonitoringSite).all()
    results: list[dict] = []

    for site in sites:
        species_count = len({obs.species_label for obs in site.observations if obs.species_label})
        degradation = habitat_service.detect_habitat_degradation(db, site_id=site.id)

        risk_score = 0
        reasoning_parts: list[str] = []

        if species_count == 0:
            risk_score += 2
            reasoning_parts.append("No species recorded at this site yet.")
        elif species_count == 1:
            risk_score += 1
            reasoning_parts.append("Only 1 distinct species recorded at this site.")
        else:
            reasoning_parts.append(f"{species_count} distinct species recorded at this site.")

        if degradation["status"] == "declining":
            risk_score += 2
            reasoning_parts.append(
                f"Habitat degradation proxy flagged 'declining' ({degradation['change_pct']}% change)."
            )
        elif degradation["status"] == "insufficient_data":
            reasoning_parts.append("Not enough observation history yet to assess habitat trend.")
        else:
            reasoning_parts.append("Habitat degradation proxy shows 'stable'.")

        if risk_score >= 3:
            priority = "high"
        elif risk_score >= 1:
            priority = "medium"
        else:
            priority = "low"

        results.append(
            {
                "site_id": site.id,
                "site_name": site.site_name,
                "priority": priority,
                "reasoning": " ".join(reasoning_parts),
            }
        )

    priority_rank = {"high": 0, "medium": 1, "low": 2}
    results.sort(key=lambda r: priority_rank[r["priority"]])
    return results


def suggest_habitat_restoration(db: Session, site_id: str) -> list[str]:
    """Templated restoration actions, triggered only if detect_habitat_degradation flagged 'declining'."""
    degradation = habitat_service.detect_habitat_degradation(db, site_id=site_id)
    if degradation["status"] != "declining":
        return []

    actions = [
        "Increase monitoring frequency at this site to confirm the trend with more data.",
        "Investigate recent habitat changes (land use, weather events, human activity nearby).",
    ]
    if degradation["change_pct"] is not None and degradation["change_pct"] <= -60:
        actions.append(
            "Escalate to field team for an in-person habitat inspection - the drop in recorded activity is severe."
        )
    return actions


def suggest_protection_strategies(db: Session, site_id: str) -> list[str]:
    """
    Templated protection actions for any species observed at this site
    that has appeared in RARE_SPECIES_OBSERVATION_THRESHOLD or fewer
    observations system-wide (naive rare/vulnerable proxy).
    """
    site = db.query(MonitoringSite).filter(MonitoringSite.id == site_id).first()
    if not site:
        return []

    total_counts = _species_total_counts(db)
    site_species = {obs.species_label for obs in site.observations if obs.species_label}

    actions: list[str] = []
    for species in sorted(site_species):
        if total_counts.get(species, 0) <= RARE_SPECIES_OBSERVATION_THRESHOLD:
            actions.append(
                f"Flag '{species}' for endangered species monitoring protocol "
                f"(only {total_counts.get(species, 0)} total observation(s) system-wide)."
            )
    return actions


def optimize_monitoring(db: Session) -> list[dict]:
    """
    Compares observation counts across all sites. Very-low-traffic sites
    get a "add more monitoring" suggestion; very-high-traffic sites get a
    "reallocate a sensor" suggestion. Thresholds are relative to the
    system's own observed min/max, not fixed absolute numbers.
    """
    sites = db.query(MonitoringSite).all()
    if not sites:
        return []

    site_counts = [(site, len(site.observations)) for site in sites]
    counts_only = [c for _, c in site_counts]
    max_count = max(counts_only)
    min_count = min(counts_only)

    results: list[dict] = []
    for site, count in site_counts:
        if max_count == min_count:
            suggestion = "Even coverage across all sites so far - no reallocation signal yet."
        elif count <= min_count + (max_count - min_count) * 0.2:
            suggestion = "Low observation volume relative to other sites - consider adding more monitoring devices."
        elif count >= max_count - (max_count - min_count) * 0.2 and count > 0:
            suggestion = "Well-monitored relative to other sites - consider reallocating a sensor elsewhere."
        else:
            suggestion = "Moderate observation volume - no action needed."
        results.append({"site_id": site.id, "site_name": site.site_name, "suggestion": suggestion})

    return results


def recommend_resource_allocation(db: Session) -> list[dict]:
    """Combines conservation priority + monitoring optimization into one final recommended action per site."""
    priorities = {p["site_id"]: p for p in get_conservation_priorities(db)}
    monitoring = {m["site_id"]: m for m in optimize_monitoring(db)}

    results: list[dict] = []
    for site_id, priority_row in priorities.items():
        monitoring_row = monitoring.get(site_id, {})
        if priority_row["priority"] == "high":
            action = f"Prioritize conservation resources here. {monitoring_row.get('suggestion', '')}".strip()
        elif priority_row["priority"] == "medium":
            action = f"Monitor closely. {monitoring_row.get('suggestion', '')}".strip()
        else:
            action = monitoring_row.get("suggestion", "No urgent action needed.")

        results.append(
            {
                "site_id": site_id,
                "site_name": priority_row["site_name"],
                "recommended_action": action,
            }
        )
    return results
