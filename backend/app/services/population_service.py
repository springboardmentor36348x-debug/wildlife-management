"""
Population Estimation Engine (Milestone 3)
--------------------------------------------
Computes population counts, trends, and density estimates from the
observations table — same data source as Biodiversity Analytics, viewed
through a population-monitoring lens instead of a diversity lens.
"""
from collections import Counter
from datetime import datetime, timedelta
from typing import Optional

from sqlalchemy.orm import Session

from app.models.observation import Observation
from app.models.monitoring_site import MonitoringSite
from app.models.survey import Survey

TREND_WINDOW_DAYS = 14  # compares last 14 days vs the 14 days before that


def _observation_query(
    db: Session,
    monitoring_site_id: Optional[str] = None,
    survey_id: Optional[str] = None,
    researcher_id: Optional[str] = None,
):
    query = db.query(Observation)

    if monitoring_site_id:
        query = query.filter(Observation.monitoring_site_id == monitoring_site_id)
    elif survey_id:
        query = query.join(
            MonitoringSite, Observation.monitoring_site_id == MonitoringSite.id
        ).filter(MonitoringSite.survey_id == survey_id)
    elif researcher_id:
        query = query.join(
            MonitoringSite, Observation.monitoring_site_id == MonitoringSite.id
        ).join(
            Survey, MonitoringSite.survey_id == Survey.id
        ).filter(Survey.created_by == researcher_id)

    return query


def calculate_population_estimates(
    db: Session,
    monitoring_site_id: Optional[str] = None,
    survey_id: Optional[str] = None,
    researcher_id: Optional[str] = None,
):
    observations = _observation_query(db, monitoring_site_id, survey_id, researcher_id).all()

    if not observations:
        return {
            "total_population_count": 0,
            "species_count": 0,
            "species_population": [],
        }

    species_counts = Counter(o.species_name for o in observations)

    # Site diversity per species, for a simple density proxy
    species_sites = {}
    for o in observations:
        species_sites.setdefault(o.species_name, set()).add(o.monitoring_site_id)

    # Trend: compare observations in the last TREND_WINDOW_DAYS vs the
    # window before that, per species
    now = datetime.utcnow()
    recent_cutoff = now - timedelta(days=TREND_WINDOW_DAYS)
    prior_cutoff = now - timedelta(days=TREND_WINDOW_DAYS * 2)

    recent_counts = Counter()
    prior_counts = Counter()
    for o in observations:
        observed_at = getattr(o, "observed_at", None) or getattr(o, "created_at", None)
        if observed_at is None:
            continue
        if observed_at >= recent_cutoff:
            recent_counts[o.species_name] += 1
        elif observed_at >= prior_cutoff:
            prior_counts[o.species_name] += 1

    species_population = []
    for species, count in species_counts.most_common():
        site_count = len(species_sites.get(species, set()))
        density = round(count / site_count, 2) if site_count > 0 else 0.0

        recent = recent_counts.get(species, 0)
        prior = prior_counts.get(species, 0)
        if (recent + prior) < 3:
            trend = "insufficient_data"
        elif prior == 0:
            trend = "increasing"
        else:
            change_pct = ((recent - prior) / prior) * 100
            if change_pct > 15:
                trend = "increasing"
            elif change_pct < -15:
                trend = "decreasing"
            else:
                trend = "stable"

        species_population.append({
            "species_name": species,
            "population_count": count,
            "sites_observed": site_count,
            "density_per_site": density,
            "trend": trend,
            "recent_period_count": recent,
            "prior_period_count": prior,
        })

    return {
        "total_population_count": len(observations),
        "species_count": len(species_counts),
        "species_population": species_population,
    }