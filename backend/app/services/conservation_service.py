"""
Conservation Recommendation Engine (Milestone 3, Feature D + Milestone 4 Threat & Action Tracking).

Consumes Feature B (population) and Feature C (habitat) data to generate
rule-based recommendations, threat monitoring alerts, and restoration action workflows.
"""
from datetime import datetime
from sqlalchemy.orm import Session

from app.models.observation import Observation
from app.models.survey import MonitoringSite
from app.models.incident import RestorationActionRecord, ActionStatus
from app.services import habitat_service, population_service, health_score_service

# An observation's species is treated as "rare/vulnerable" at a site if it
# has 2 or fewer total observations system-wide.
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
    """Templated restoration actions, triggered if detect_habitat_degradation flagged 'declining' or baseline."""
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
    observations system-wide.
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
    get a 'add more monitoring' suggestion; very-high-traffic sites get a
    'reallocate a sensor' suggestion.
    """
    sites = db.query(MonitoringSite).all()
    if not sites:
        return []

    site_counts = [(site, len(site.observations)) for site in sites]
    counts_only = [c for _, c in site_counts]
    max_count = max(counts_only) if counts_only else 0
    min_count = min(counts_only) if counts_only else 0

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


def get_or_sync_restoration_actions(db: Session, site_id: str) -> list[RestorationActionRecord]:
    """
    Returns existing restoration action records for a site, or initializes
    them from suggest_habitat_restoration if none exist yet.
    """
    existing = (
        db.query(RestorationActionRecord)
        .filter(RestorationActionRecord.site_id == site_id)
        .order_by(RestorationActionRecord.created_at.asc())
        .all()
    )
    if existing:
        return existing

    suggested_texts = suggest_habitat_restoration(db, site_id=site_id)
    if not suggested_texts:
        degradation = habitat_service.detect_habitat_degradation(db, site_id=site_id)
        if degradation["status"] == "declining":
            suggested_texts = [
                "Increase monitoring frequency at this site to confirm the trend with more data.",
                "Investigate recent habitat changes (land use, weather events, human activity nearby)."
            ]

    created = []
    for text in suggested_texts:
        rec = RestorationActionRecord(
            site_id=site_id,
            action_text=text,
            status=ActionStatus.OPEN,
        )
        db.add(rec)
        created.append(rec)
    if created:
        db.commit()
        for r in created:
            db.refresh(r)
    return created


def update_restoration_action_status(
    db: Session,
    action_id: str,
    status: ActionStatus,
    notes: str | None = None,
    assigned_to: str | None = None,
) -> RestorationActionRecord | None:
    """Updates the status (open/in_progress/completed) of a restoration action."""
    action = db.query(RestorationActionRecord).filter(RestorationActionRecord.id == action_id).first()
    if not action:
        return None
    action.status = status
    if notes is not None:
        action.notes = notes
    if assigned_to is not None:
        action.assigned_to = assigned_to
    db.commit()
    db.refresh(action)
    return action


def get_threat_alerts(db: Session) -> list[dict]:
    """
    Evaluates real live data across engines to compile active threat alerts.
    """
    alerts: list[dict] = []

    # 1. Endangered / Rare Species Sightings
    total_counts = _species_total_counts(db)
    rare_species = {s: c for s, c in total_counts.items() if c <= RARE_SPECIES_OBSERVATION_THRESHOLD}

    for species, count in rare_species.items():
        recent_obs = (
            db.query(Observation)
            .filter(Observation.species_label == species)
            .order_by(Observation.captured_at.desc())
            .first()
        )
        if recent_obs and recent_obs.site:
            alerts.append({
                "id": f"ALERT-RARE-{abs(hash(species)) % 9000 + 1000}",
                "threat_type": "endangered_species_detected",
                "severity": "critical" if count == 1 else "high",
                "title": f"Rare Species Detected: {species.capitalize()}",
                "description": f"Observation logged at '{recent_obs.site.site_name}'. System total: {count} observation(s).",
                "site_id": recent_obs.site.id,
                "site_name": recent_obs.site.site_name,
                "timestamp": recent_obs.captured_at.isoformat() if recent_obs.captured_at else None,
                "recommended_action": f"Initiate species protection protocol and verify telemetry at {recent_obs.site.site_name}.",
            })

    # 2. Habitat Degradation Flags
    sites = db.query(MonitoringSite).all()
    for site in sites:
        deg = habitat_service.detect_habitat_degradation(db, site_id=site.id)
        if deg["status"] == "declining":
            change = deg.get("change_pct")
            severity = "critical" if change is not None and change <= -50 else "high"
            alerts.append({
                "id": f"ALERT-DEG-{abs(hash(site.id)) % 9000 + 1000}",
                "threat_type": "habitat_degradation",
                "severity": severity,
                "title": f"Habitat Activity Drop: {site.site_name}",
                "description": f"Recorded wildlife activity dropped by {change}% over trailing 90-day window.",
                "site_id": site.id,
                "site_name": site.site_name,
                "timestamp": datetime.now().isoformat(),
                "recommended_action": "Schedule on-site ranger inspection to assess environmental pressure.",
            })

    # 3. Critical Health Status Sites
    for site in sites:
        health = health_score_service.calculate_ecosystem_health(db, site_id=site.id)
        if health.get("conservation_status") in ("Critical", "Vulnerable"):
            alerts.append({
                "id": f"ALERT-HLT-{abs(hash(site.id)) % 9000 + 1000}",
                "threat_type": "ecosystem_health_vulnerable",
                "severity": "critical" if health.get("conservation_status") == "Critical" else "medium",
                "title": f"Ecosystem Health {health.get('conservation_status')}: {site.site_name}",
                "description": f"Overall health score computed at {health.get('ecosystem_health_score')}/100.",
                "site_id": site.id,
                "site_name": site.site_name,
                "timestamp": datetime.now().isoformat(),
                "recommended_action": "Review diversity, stability, and habitat components for intervention.",
            })

    # Sort alerts by severity (critical first, then high, then medium)
    sev_rank = {"critical": 0, "high": 1, "medium": 2, "low": 3}
    alerts.sort(key=lambda a: sev_rank.get(a["severity"], 9))
    return alerts
