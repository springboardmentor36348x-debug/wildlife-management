"""
Habitat Intelligence Engine (Milestone 3, Feature C).

We have no real satellite imagery, NDVI vegetation feed, or environmental
sensor connection in this system. Every function here either (a) uses
real data we DO have (MonitoringSite.habitat_type, Feature B's
population/species data, Observation timestamps) as an honest, clearly
documented proxy, or (b) returns a plain "not_available" /
"insufficient_data" result rather than fabricating numbers that would
look real but aren't.
"""
from datetime import datetime, timedelta, timezone

from sqlalchemy.orm import Session

from app.models.observation import Observation
from app.models.survey import MonitoringSite

# Small habitat-compatibility lookup table used by predict_habitat_suitability.
# This is a coarse, illustrative mapping (not derived from any ecological
# dataset) - real habitat-suitability modeling needs species range maps
# and environmental covariates (e.g. from IUCN / GBIF / remote sensing).
HABITAT_SPECIES_COMPATIBILITY: dict[str, list[str]] = {
    "forest": ["elephant", "bear", "bird", "leopard", "monkey"],
    "grassland": ["zebra", "giraffe", "cow", "sheep", "bird"],
    "wetland": ["bird", "frog", "fish"],
    "riverine": ["bird", "frog", "elephant"],
    "mountain": ["bear", "sheep", "bird"],
    "marine": ["fish", "bird"],
    "other": [],
}


def classify_habitat(site: MonitoringSite) -> str:
    """
    Returns the site's real, already-recorded habitat_type - not a proxy,
    this is genuine field-registered data (see MonitoringSite.habitat_type
    in the Milestone 1 survey/site registration form).
    """
    return site.habitat_type.value if hasattr(site.habitat_type, "value") else str(site.habitat_type)


def detect_habitat_degradation(db: Session, site_id: str, window_days: int = 90) -> dict:
    """
    PROXY for real degradation detection: compares species-observation
    count in the most recent `window_days` window against an equal-length
    prior window at the same site. A meaningful drop is treated as a
    "declining" signal.

    HONEST LIMITATION: real habitat degradation detection needs a
    vegetation/NDVI satellite time series (e.g. Sentinel-2, Landsat via
    Google Earth Engine) - this proxy only reflects how much wildlife
    activity was recorded, which can drop for reasons that have nothing
    to do with habitat quality (e.g. fewer field visits, a broken camera
    trap). Treat "declining" here as "worth investigating," not proof.
    """
    now = datetime.now(timezone.utc)
    recent_start = now - timedelta(days=window_days)
    previous_start = now - timedelta(days=window_days * 2)

    observations = (
        db.query(Observation)
        .filter(Observation.site_id == site_id, Observation.species_label.isnot(None))
        .all()
    )

    recent_count = 0
    previous_count = 0
    for obs in observations:
        captured = obs.captured_at
        if captured.tzinfo is None:
            captured = captured.replace(tzinfo=timezone.utc)
        if recent_start <= captured <= now:
            recent_count += 1
        elif previous_start <= captured < recent_start:
            previous_count += 1

    if previous_count == 0 and recent_count == 0:
        return {
            "status": "insufficient_data",
            "recent_count": recent_count,
            "previous_count": previous_count,
            "change_pct": None,
        }
    if previous_count == 0:
        # Went from zero prior activity to some activity - can't compute a
        # meaningful percentage change off a zero base; call it stable
        # rather than divide-by-zero into a fabricated huge number.
        return {
            "status": "stable",
            "recent_count": recent_count,
            "previous_count": previous_count,
            "change_pct": None,
        }

    change_pct = round(((recent_count - previous_count) / previous_count) * 100, 1)
    # A drop of more than 30% in recorded species activity is treated as
    # the "declining" threshold - a deliberately conservative cutoff so a
    # small day-to-day fluctuation doesn't get flagged as degradation.
    status = "declining" if change_pct <= -30 else "stable"

    return {
        "status": status,
        "recent_count": recent_count,
        "previous_count": previous_count,
        "change_pct": change_pct,
    }


def analyze_vegetation(site: MonitoringSite) -> dict:
    """
    No real vegetation/NDVI data source is connected. Returns an honest
    "not_available" result rather than fabricated numbers.
    Real implementation would pull NDVI time series from Sentinel Hub,
    Google Earth Engine, or NASA EarthData for this site's coordinates.
    """
    return {
        "status": "not_available",
        "reason": (
            "No satellite/NDVI vegetation data source is connected. "
            "Would require integrating Sentinel Hub, Google Earth Engine, "
            "or NASA EarthData for this site's coordinates."
        ),
    }


def monitor_environmental_conditions(site: MonitoringSite) -> dict:
    """
    No real environmental sensor feed (temperature/humidity/rainfall) is
    connected. Returns an honest "not_available" result rather than
    randomly generated numbers.
    """
    return {
        "status": "not_available",
        "reason": (
            "No environmental sensor (temperature/humidity/rainfall) feed "
            "is connected for this site. Would require integrating a real "
            "weather/environmental sensor API."
        ),
    }


def predict_habitat_suitability(db: Session, site_id: str, species_label: str) -> dict:
    """
    PROXY: combines (1) whether this site's habitat_type is generally
    compatible with the species (small lookup table above) with (2)
    whether the species has actually been observed at OTHER sites of the
    same habitat_type elsewhere in the system.

    0-100 suitability_score, weighted: 50 points from habitat_type
    compatibility, up to 50 more from real cross-site observation
    evidence (10 points per corroborating site, capped at 5 sites).
    """
    site = db.query(MonitoringSite).filter(MonitoringSite.id == site_id).first()
    if not site:
        return {"suitability_score": 0, "reasoning": "Site not found."}

    habitat_type = site.habitat_type.value if hasattr(site.habitat_type, "value") else str(site.habitat_type)
    compatible_species = HABITAT_SPECIES_COMPATIBILITY.get(habitat_type, [])
    habitat_match = species_label.lower() in [s.lower() for s in compatible_species]

    same_habitat_sites = (
        db.query(MonitoringSite)
        .filter(MonitoringSite.habitat_type == site.habitat_type, MonitoringSite.id != site_id)
        .all()
    )
    corroborating_sites = 0
    for other_site in same_habitat_sites:
        for obs in other_site.observations:
            if obs.species_label and obs.species_label.lower() == species_label.lower():
                corroborating_sites += 1
                break

    score = 0
    reasoning_parts: list[str] = []

    if habitat_match:
        score += 50
        reasoning_parts.append(
            f"'{species_label}' is on the compatibility list for habitat_type '{habitat_type}' (+50)."
        )
    else:
        reasoning_parts.append(
            f"'{species_label}' is not on the compatibility list for habitat_type '{habitat_type}' (+0)."
        )

    corroboration_score = min(corroborating_sites, 5) * 10
    score += corroboration_score
    if corroborating_sites > 0:
        reasoning_parts.append(
            f"Observed at {corroborating_sites} other real '{habitat_type}' site(s) in this system "
            f"(+{corroboration_score}, capped at 50)."
        )
    else:
        reasoning_parts.append(
            f"No real observations of '{species_label}' at any other '{habitat_type}' site yet (+0)."
        )

    return {
        "suitability_score": min(score, 100),
        "reasoning": " ".join(reasoning_parts),
    }
