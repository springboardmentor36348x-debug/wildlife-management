"""
Biodiversity Intelligence Engine (Milestone 2 slice)
-----------------------------------------------------
Computes standard ecological diversity metrics from logged observations
(manual + image + audio derived). Works off the existing `observations`
table so it reflects everything researchers have recorded, regardless of
whether it came from a manual entry, the image analysis engine, or the
bioacoustic engine.
"""
import math
from collections import Counter
from typing import Optional

from sqlalchemy.orm import Session

from app.models.observation import Observation
from app.models.monitoring_site import MonitoringSite
from app.models.survey import Survey


def _species_counts(
    db: Session,
    monitoring_site_id: Optional[str],
    survey_id: Optional[str],
    researcher_id: Optional[str] = None,
):
    query = db.query(Observation.species_name)

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

    rows = query.all()
    return Counter(r.species_name for r in rows)


def calculate_biodiversity_index(
    db: Session,
    monitoring_site_id: Optional[str] = None,
    survey_id: Optional[str] = None,
    researcher_id: Optional[str] = None,
):
    counts = _species_counts(db, monitoring_site_id, survey_id, researcher_id)
    total = sum(counts.values())
    richness = len(counts)

    if total == 0 or richness == 0:
        return {
            "species_richness": 0,
            "total_observations": 0,
            "shannon_index": 0.0,
            "simpson_index": 0.0,
            "evenness": 0.0,
            "species_breakdown": [],
        }

    proportions = [count / total for count in counts.values()]

    shannon = -sum(p * math.log(p) for p in proportions)
    simpson = 1 - sum(p ** 2 for p in proportions)
    evenness = shannon / math.log(richness) if richness > 1 else 1.0

    breakdown = sorted(
        [{"species_name": s, "count": c, "relative_abundance": round(c / total, 4)}
         for s, c in counts.items()],
        key=lambda x: x["count"],
        reverse=True,
    )

    return {
        "species_richness": richness,
        "total_observations": total,
        "shannon_index": round(shannon, 4),
        "simpson_index": round(simpson, 4),
        "evenness": round(evenness, 4),
        "species_breakdown": breakdown,
    }