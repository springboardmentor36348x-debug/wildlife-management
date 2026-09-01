import math
from typing import List, Dict, Any, Optional
from sqlalchemy.orm import Session
from sqlalchemy import desc

import models_monitoring as mm
import schemas_intelligence as si
from services.population_service import get_species_meta


def compute_biodiversity_analytics(db: Session, site_id: Optional[int] = None) -> si.BiodiversityMetrics:
    """
    Computes scientific biodiversity metrics strictly from real database observations.
    """
    query = db.query(mm.Observation)
    if site_id:
        query = query.filter(mm.Observation.monitoring_site_id == site_id)
    
    observations = query.order_by(desc(mm.Observation.observation_datetime)).all()
    total_obs = len(observations)

    # 1. Real species tally from DB
    counts: Dict[str, int] = {}
    for obs in observations:
        sp = obs.species.strip()
        counts[sp] = counts.get(sp, 0) + 1

    # 2. Species Richness (S)
    richness = len(counts)

    # 3. Shannon-Wiener Diversity Index (H') = - SUM(p_i * ln(p_i))
    # 4. Simpson's Diversity Index (1 - D) = 1 - SUM(p_i^2)
    shannon_h = 0.0
    simpson_d_sum = 0.0

    if total_obs > 0:
        for count in counts.values():
            p_i = count / total_obs
            if p_i > 0:
                shannon_h -= p_i * math.log(p_i)
                simpson_d_sum += p_i ** 2

    simpsons_index = round(1.0 - simpson_d_sum, 3) if total_obs > 0 else 0.0
    shannon_h = round(shannon_h, 3)

    # 5. Category Breakdown (Mammals, Birds, Amphibians, Others)
    category_counts = {"Mammals": 0, "Birds": 0, "Amphibians": 0, "Others": 0}
    threatened_count = 0
    endemic_count = 0

    for sp_name, cnt in counts.items():
        meta = get_species_meta(sp_name)
        cat = meta.get("category", "Mammal")
        if cat == "Mammal":
            category_counts["Mammals"] += cnt
        elif cat == "Bird":
            category_counts["Birds"] += cnt
        elif cat == "Amphibian":
            category_counts["Amphibians"] += cnt
        else:
            category_counts["Others"] += cnt

        if meta.get("iucn") in ("Critically Endangered", "Endangered", "Vulnerable"):
            threatened_count += 1
        endemic_count += 1

    total_cat_obs = max(1, sum(category_counts.values()))
    species_distribution = [
        {"name": "Mammals", "value": round((category_counts["Mammals"] / total_cat_obs) * 100), "color": "#2f9159"},
        {"name": "Birds", "value": round((category_counts["Birds"] / total_cat_obs) * 100), "color": "#4bb377"},
        {"name": "Amphibians", "value": round((category_counts["Amphibians"] / total_cat_obs) * 100), "color": "#a3d9b8"},
        {"name": "Others", "value": round((category_counts["Others"] / total_cat_obs) * 100), "color": "#d7ecdf"},
    ]

    # 6. Ecosystem Health Score (0–100)
    if richness > 1 and total_obs > 0:
        max_h = math.log(richness)
        equitability = min(1.0, shannon_h / max_h) if max_h > 0 else 0.8
        health_score = round((equitability * 50.0) + min(35.0, richness * 10.0) + 15.0, 1)
    elif richness == 1:
        health_score = 65.0
    else:
        health_score = 0.0

    if health_score >= 80:
        health_grade = "Excellent"
    elif health_score >= 65:
        health_grade = "Good"
    elif health_score >= 50:
        health_grade = "Moderate"
    else:
        health_grade = "Degraded"

    # 7. Real Recent Occurrences directly from DB rows
    recent_occurrences: List[si.SpeciesOccurrenceRecord] = []
    for obs in observations[:10]:
        meta = get_species_meta(obs.species)
        site_name = obs.monitoring_site.site_name if obs.monitoring_site else "General Sector"
        date_str = obs.observation_datetime.strftime("%b %d, %Y") if obs.observation_datetime else "Recent"
        
        recent_occurrences.append(
            si.SpeciesOccurrenceRecord(
                id=obs.id,
                species=meta.get("common", obs.species),
                latin_name=meta.get("latin"),
                location=site_name,
                date=date_str,
                status="Observed",
                confidence_score=obs.confidence_score or 0.95,
                detection_source=obs.detection_source.value if hasattr(obs.detection_source, 'value') else str(obs.detection_source)
            )
        )

    protected_areas = db.query(mm.MonitoringSite).count()

    return si.BiodiversityMetrics(
        total_species=richness,
        species_richness=richness,
        shannon_diversity_index=shannon_h,
        simpsons_diversity_index=simpsons_index,
        endemic_species_count=endemic_count,
        threatened_species_count=threatened_count,
        protected_areas_count=protected_areas,
        ecosystem_health_score=health_score,
        ecosystem_health_grade=health_grade,
        species_distribution=species_distribution,
        recent_occurrences=recent_occurrences
    )
