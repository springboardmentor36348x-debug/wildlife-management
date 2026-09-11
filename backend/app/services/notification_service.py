"""
Notification & Alert System (FR-12) - Milestone 4.

Every alert type the project report asks for is generated here by
re-using the exact same real-data logic that already powers the
Population / Habitat / Conservation pages (Milestone 3). Nothing in this
file invents a number - each rule is documented with what it actually
measures and its honest limitation, matching the rest of this codebase's
approach (see MILESTONE3_NOTES.md).

  - Endangered species alerts   -> conservation_service's "rare species"
                                    proxy (<= RARE_SPECIES_OBSERVATION_THRESHOLD
                                    total observations system-wide).
  - Population decline alerts   -> habitat_service.detect_habitat_degradation's
                                    "declining" observation-activity signal,
                                    read as a population-level trend.
  - Habitat degradation alerts  -> the same "declining" signal, read at the
                                    habitat/site level (this is intentionally
                                    the same underlying proxy computation -
                                    there is no separate vegetation/NDVI feed
                                    connected, see habitat_service.py).
  - Monitoring device alerts    -> a site with zero observations in the last
                                    STALE_DEVICE_DAYS days. This is an honest
                                    proxy for "device offline" - there is no
                                    real device heartbeat/telemetry channel
                                    connected, only whether data has recently
                                    arrived from that site.
  - Conservation notifications  -> conservation_service's "high" priority
                                    sites.

`sync_notifications` is idempotent: each alert has a deterministic
`alert_key` (alert_type + site_id + species_label), so re-running the
scan updates/keeps existing rows (preserving is_read) instead of
duplicating them, and removes alerts whose underlying condition has
since cleared.
"""
import hashlib
from datetime import datetime, timedelta, timezone

from sqlalchemy.orm import Session

from app.models.notification import Notification, AlertType, AlertSeverity
from app.models.survey import MonitoringSite
from app.models.observation import Observation
from app.services import habitat_service, conservation_service

STALE_DEVICE_DAYS = 30


def _key(alert_type: str, site_id: str | None, species_label: str | None) -> str:
    raw = f"{alert_type}:{site_id or '-'}:{species_label or '-'}"
    return hashlib.sha256(raw.encode()).hexdigest()[:32]


def _generate_candidates(db: Session) -> list[dict]:
    candidates: list[dict] = []
    sites = db.query(MonitoringSite).all()

    # --- Endangered species alerts -----------------------------------
    total_counts = conservation_service._species_total_counts(db)
    for site in sites:
        site_species = {obs.species_label for obs in site.observations if obs.species_label}
        for species in sorted(site_species):
            count = total_counts.get(species, 0)
            if count <= conservation_service.RARE_SPECIES_OBSERVATION_THRESHOLD:
                candidates.append(
                    {
                        "alert_type": AlertType.ENDANGERED_SPECIES,
                        "severity": AlertSeverity.CRITICAL,
                        "title": f"Rare/vulnerable species detected: {species}",
                        "message": (
                            f"'{species}' has only {count} total observation(s) system-wide and was "
                            f"recorded at {site.site_name}. Flagged for the endangered-species "
                            f"monitoring protocol (proxy threshold, no IUCN Red List feed connected)."
                        ),
                        "site_id": site.id,
                        "site_name": site.site_name,
                        "species_label": species,
                    }
                )

    # --- Population decline & Habitat degradation alerts --------------
    for site in sites:
        degradation = habitat_service.detect_habitat_degradation(db, site_id=site.id)
        if degradation["status"] == "declining":
            candidates.append(
                {
                    "alert_type": AlertType.POPULATION_DECLINE,
                    "severity": AlertSeverity.WARNING,
                    "title": f"Population activity declining at {site.site_name}",
                    "message": (
                        f"Recorded species activity dropped {degradation['change_pct']}% "
                        f"({degradation['previous_count']} -> {degradation['recent_count']} observations) "
                        f"over the trailing window. Worth investigating, not proof of an actual decline."
                    ),
                    "site_id": site.id,
                    "site_name": site.site_name,
                    "species_label": None,
                }
            )
            candidates.append(
                {
                    "alert_type": AlertType.HABITAT_DEGRADATION,
                    "severity": AlertSeverity.WARNING,
                    "title": f"Habitat degradation signal at {site.site_name}",
                    "message": (
                        f"Observation-activity proxy flagged 'declining' ({degradation['change_pct']}% change). "
                        f"No satellite/NDVI feed is connected - treat as \"worth a field visit\", not confirmed "
                        f"habitat loss."
                    ),
                    "site_id": site.id,
                    "site_name": site.site_name,
                    "species_label": None,
                }
            )

    # --- Monitoring device alerts (stale-site proxy) -------------------
    now = datetime.now(timezone.utc)
    stale_cutoff = now - timedelta(days=STALE_DEVICE_DAYS)
    for site in sites:
        last_obs = (
            db.query(Observation)
            .filter(Observation.site_id == site.id)
            .order_by(Observation.captured_at.desc())
            .first()
        )
        last_seen = None
        if last_obs:
            last_seen = last_obs.captured_at
            if last_seen.tzinfo is None:
                last_seen = last_seen.replace(tzinfo=timezone.utc)
        if last_obs is None or last_seen < stale_cutoff:
            days_text = "no data ever received" if last_obs is None else f"no data since {last_seen.date()}"
            candidates.append(
                {
                    "alert_type": AlertType.MONITORING_DEVICE,
                    "severity": AlertSeverity.WARNING,
                    "title": f"{site.monitoring_device.value.replace('_', ' ').title()} may be offline at {site.site_name}",
                    "message": (
                        f"No observations logged from this site in over {STALE_DEVICE_DAYS} days ({days_text}). "
                        f"Proxy for device health - there is no real hardware heartbeat/telemetry channel "
                        f"connected, only whether field data has recently arrived."
                    ),
                    "site_id": site.id,
                    "site_name": site.site_name,
                    "species_label": None,
                }
            )

    # --- Conservation notifications (high priority sites) --------------
    for p in conservation_service.get_conservation_priorities(db):
        if p["priority"] == "high":
            candidates.append(
                {
                    "alert_type": AlertType.CONSERVATION,
                    "severity": AlertSeverity.CRITICAL,
                    "title": f"High conservation priority: {p['site_name']}",
                    "message": p["reasoning"],
                    "site_id": p["site_id"],
                    "site_name": p["site_name"],
                    "species_label": None,
                }
            )

    return candidates


def sync_notifications(db: Session) -> list[Notification]:
    """
    Regenerates the alert set from current data and upserts it into the
    notifications table, preserving is_read on alerts that still apply
    and removing alerts whose condition has cleared since the last sync.
    """
    candidates = _generate_candidates(db)
    live_keys: set[str] = set()

    for c in candidates:
        alert_key = _key(c["alert_type"].value, c["site_id"], c["species_label"])
        live_keys.add(alert_key)
        existing = db.query(Notification).filter(Notification.alert_key == alert_key).first()
        if existing:
            existing.title = c["title"]
            existing.message = c["message"]
            existing.severity = c["severity"]
            existing.updated_at = datetime.now(timezone.utc)
        else:
            db.add(
                Notification(
                    alert_key=alert_key,
                    alert_type=c["alert_type"],
                    severity=c["severity"],
                    title=c["title"],
                    message=c["message"],
                    site_id=c["site_id"],
                    site_name=c["site_name"],
                    species_label=c["species_label"],
                )
            )

    # Clear alerts whose underlying condition no longer holds.
    stale = (
        db.query(Notification).filter(~Notification.alert_key.in_(list(live_keys))).all()
        if live_keys
        else db.query(Notification).all()
    )
    for n in stale:
        db.delete(n)

    db.commit()
    severity_rank = {"critical": 0, "warning": 1, "info": 2}
    rows = db.query(Notification).order_by(Notification.created_at.desc()).all()
    rows.sort(key=lambda n: severity_rank.get(n.severity.value, 3))
    return rows
