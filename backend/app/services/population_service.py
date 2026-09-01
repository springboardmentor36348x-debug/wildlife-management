"""
Population Estimation Engine (Milestone 3, Feature B).

Every function here works off REAL Observation rows only - species_label
populated by either the image (YOLOv8) or audio (YAMNet) detection
pipeline. Nothing here fabricates rows or numbers; where the underlying
data isn't rich enough to answer a metric properly (e.g. true migration
tracking, true animals/km2 density), that limitation is documented
in-line and reflected honestly in the function's return shape, not
papered over.
"""
from datetime import datetime, timedelta, timezone

from sqlalchemy import func
from sqlalchemy.orm import Session

from app.models.observation import Observation
from app.models.survey import MonitoringSite


def get_population_counts(db: Session, survey_id: str | None = None) -> list[dict]:
    """Counts observations grouped by species_label, optionally filtered to one survey."""
    query = (
        db.query(Observation.species_label, func.count(Observation.id))
        .filter(Observation.species_label.isnot(None))
    )
    if survey_id:
        query = query.join(MonitoringSite, Observation.site_id == MonitoringSite.id).filter(
            MonitoringSite.survey_id == survey_id
        )
    rows = query.group_by(Observation.species_label).order_by(func.count(Observation.id).desc()).all()
    return [{"species": species, "count": count} for species, count in rows]


def get_population_density(db: Session, survey_id: str | None = None) -> list[dict]:
    """
    Per-site RELATIVE density proxy (observation count per site), NOT
    true animals/km^2 - MonitoringSite has no area/boundary/polygon data,
    only a point (latitude/longitude), so a true density calculation
    isn't possible with what we have. Real data that would fix this:
    a site boundary/catchment-area polygon (e.g. PostGIS geometry) to
    divide the count by.
    """
    query = (
        db.query(
            MonitoringSite.id,
            MonitoringSite.site_name,
            Observation.species_label,
            func.count(Observation.id),
        )
        .join(Observation, Observation.site_id == MonitoringSite.id)
        .filter(Observation.species_label.isnot(None))
    )
    if survey_id:
        query = query.filter(MonitoringSite.survey_id == survey_id)
    rows = (
        query.group_by(MonitoringSite.id, MonitoringSite.site_name, Observation.species_label)
        .order_by(MonitoringSite.site_name)
        .all()
    )
    return [
        {"site_id": site_id, "site_name": site_name, "species": species, "count": count}
        for site_id, site_name, species, count in rows
    ]


def get_population_trend(
    db: Session,
    species_label: str,
    survey_id: str | None = None,
    window_days: int = 30,
) -> list[dict]:
    """
    Buckets observations of one species by day over the trailing
    `window_days`. If there isn't enough time-spread test data to show a
    real trend (e.g. all observations were captured within the same
    minute during testing), this still returns the correct query shape -
    it just won't show variation. More longitudinal data collection is
    what makes this metric meaningful in production; this function never
    fabricates historical rows to fake a trend.
    """
    since = datetime.now(timezone.utc) - timedelta(days=window_days)
    query = (
        db.query(func.date(Observation.captured_at), func.count(Observation.id))
        .filter(Observation.species_label == species_label)
        .filter(Observation.captured_at >= since)
    )
    if survey_id:
        query = query.join(MonitoringSite, Observation.site_id == MonitoringSite.id).filter(
            MonitoringSite.survey_id == survey_id
        )
    rows = query.group_by(func.date(Observation.captured_at)).order_by(func.date(Observation.captured_at)).all()
    return [{"date": str(date), "count": count} for date, count in rows]


def get_species_distribution(db: Session, survey_id: str | None = None) -> list[dict]:
    """Per-site species breakdown, for mapping species distribution geographically."""
    sites_query = db.query(MonitoringSite)
    if survey_id:
        sites_query = sites_query.filter(MonitoringSite.survey_id == survey_id)
    sites = sites_query.all()

    result = []
    for site in sites:
        rows = (
            db.query(Observation.species_label, func.count(Observation.id))
            .filter(Observation.site_id == site.id, Observation.species_label.isnot(None))
            .group_by(Observation.species_label)
            .all()
        )
        result.append(
            {
                "site_id": site.id,
                "site_name": site.site_name,
                "latitude": site.latitude,
                "longitude": site.longitude,
                "species_counts": [{"species": s, "count": c} for s, c in rows],
            }
        )
    return result


def get_species_site_movement(db: Session, species_label: str) -> list[dict]:
    """
    Migration-analysis PROXY: lists which sites this species has been
    observed at, chronologically ordered by first-seen timestamp at each
    site. This is NOT individual-animal migration tracking - we have no
    way to tell whether the same physical animal moved between sites, or
    whether different individuals of the same species were independently
    observed at each site. True migration tracking needs individually
    tagged/re-identified animals (e.g. RFID collars, photo-ID re-matching),
    which is out of scope for this milestone.
    """
    rows = (
        db.query(
            MonitoringSite.id,
            MonitoringSite.site_name,
            MonitoringSite.latitude,
            MonitoringSite.longitude,
            func.min(Observation.captured_at),
            func.count(Observation.id),
        )
        .join(Observation, Observation.site_id == MonitoringSite.id)
        .filter(Observation.species_label == species_label)
        .group_by(MonitoringSite.id, MonitoringSite.site_name, MonitoringSite.latitude, MonitoringSite.longitude)
        .order_by(func.min(Observation.captured_at))
        .all()
    )
    return [
        {
            "site_id": site_id,
            "site_name": site_name,
            "latitude": lat,
            "longitude": lon,
            "first_observed_at": str(first_seen),
            "observation_count": count,
        }
        for site_id, site_name, lat, lon, first_seen, count in rows
    ]
