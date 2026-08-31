"""
Habitat Intelligence Engine (Milestone 3)
--------------------------------------------
Computes a habitat health score per monitoring site, derived from species
diversity and population stability observed at that site — the signals
actually available from observation data. True vegetation analysis and
satellite-based degradation detection would require remote sensing data
this project does not currently ingest.
"""
import math
from collections import Counter
from typing import Optional

from sqlalchemy.orm import Session

from app.models.observation import Observation
from app.models.monitoring_site import MonitoringSite
from app.models.survey import Survey


def _sites_query(db: Session, researcher_id: Optional[str] = None):
    query = db.query(MonitoringSite)
    if researcher_id:
        query = query.join(
            Survey, MonitoringSite.survey_id == Survey.id
        ).filter(Survey.created_by == researcher_id)
    return query


def _habitat_status(score: float) -> str:
    if score >= 80:
        return "Healthy"
    elif score >= 60:
        return "Moderate Concern"
    elif score >= 40:
        return "Vulnerable"
    else:
        return "Critical"


def calculate_habitat_intelligence(
    db: Session,
    researcher_id: Optional[str] = None,
):
    sites = _sites_query(db, researcher_id).all()

    if not sites:
        return {"site_count": 0, "sites": []}

    results = []
    for site in sites:
        observations = db.query(Observation).filter(
            Observation.monitoring_site_id == site.id
        ).all()

        species_counts = Counter(o.species_name for o in observations)
        richness = len(species_counts)
        total_obs = len(observations)

        # Diversity score (0-100): Shannon-based, scaled
        if total_obs > 0 and richness > 0:
            proportions = [c / total_obs for c in species_counts.values()]
            shannon = -sum(p * math.log(p) for p in proportions)
            # Normalize against a reasonable max Shannon value of ~3.0 (about 20 evenly-distributed species)
            diversity_score = min(100, round((shannon / 3.0) * 100, 1))
        else:
            diversity_score = 0.0

        # Population stability score (0-100): fewer single-sighting
        # species relative to total = more stable presence
        if richness > 0:
            recurring_species = sum(1 for c in species_counts.values() if c > 1)
            stability_score = round((recurring_species / richness) * 100, 1)
        else:
            stability_score = 0.0

        # Habitat health = weighted blend of diversity + stability
        # (Full ecosystem health scoring, using the PDF's 5-factor weighted
        # formula, is computed separately once endangered-species and
        # environmental data are available — see Ecosystem Health Analytics.)
        habitat_score = round((diversity_score * 0.6) + (stability_score * 0.4), 1)

        results.append({
            "site_id": site.id,
            "site_name": site.site_name,
            "habitat_type": site.habitat_type,
            "protected_area": site.protected_area,
            "species_richness": richness,
            "total_observations": total_obs,
            "diversity_score": diversity_score,
            "stability_score": stability_score,
            "habitat_health_score": habitat_score,
            "status": _habitat_status(habitat_score),
        })

    results.sort(key=lambda r: r["habitat_health_score"], reverse=True)

    return {
        "site_count": len(results),
        "sites": results,
    }