"""
Biodiversity Intelligence Router
"""

from fastapi import APIRouter, Depends, HTTPException, status
from sqlalchemy.orm import Session
from sqlalchemy import func
from typing import Optional, Dict, Any, List

from database import get_db
from models import Observation, Survey, Species, MonitoringSite, BiodiversityAnalytics, User
from schemas.intelligence import BiodiversityMetrics
from ai.biodiversity_engine import biodiversity_engine
from security import get_current_active_user

router = APIRouter()


@router.get("/metrics", response_model=BiodiversityMetrics)
def get_biodiversity_metrics(
    site_id: Optional[int] = None,
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_active_user)
):
    """
    Calculate ecological biodiversity indices:
    Species Richness, Shannon-Wiener Index, Simpson Index, Pielou Evenness, and Taxonomic Distribution.
    """
    site = None
    if site_id:
        site = db.query(MonitoringSite).filter(MonitoringSite.id == site_id).first()
        if not site:
            raise HTTPException(status_code=404, detail="Monitoring site not found")
        site_name = site.site_name
    else:
        site_name = "All Monitoring Reserves (Aggregate)"

    query = db.query(
        Species.common_name,
        Species.species_group,
        func.count(Observation.id).label("obs_count")
    ).join(Observation, Species.id == Observation.species_id)

    if site_id:
        query = query.join(Survey, Observation.survey_id == Survey.id)\
                     .filter(Survey.monitoring_site_id == site_id)

    species_data = query.group_by(Species.id).all()

    species_counts = {c_name: cnt for c_name, grp, cnt in species_data}
    
    # Taxonomic group breakdown
    group_distribution: Dict[str, int] = {}
    for c_name, grp, cnt in species_data:
        g = grp or "Mammal"
        group_distribution[g] = group_distribution.get(g, 0) + cnt

    # Calculate indices
    indices = biodiversity_engine.calculate_indices(species_counts)

    # Top dominant species
    total_obs = indices["total_observations"] or 1
    sorted_species = sorted(species_data, key=lambda x: x[2], reverse=True)[:5]
    top_dominant = [
        {
            "species": sp[0],
            "group": sp[1],
            "observations": sp[2],
            "relative_abundance_pct": round((sp[2] / total_obs) * 100.0, 1)
        }
        for sp in sorted_species
    ]

    return BiodiversityMetrics(
        site_id=site_id or 0,
        site_name=site_name,
        species_richness=indices["species_richness"],
        shannon_diversity_index=indices["shannon_diversity"],
        simpson_diversity_index=indices["simpson_diversity"],
        pielou_evenness=indices["evenness"],
        total_observations=indices["total_observations"],
        biodiversity_score=indices["biodiversity_score"],
        biodiversity_status=indices["biodiversity_status"],
        species_group_distribution=group_distribution,
        top_dominant_species=top_dominant
    )
