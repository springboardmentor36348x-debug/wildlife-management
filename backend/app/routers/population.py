from typing import List, Optional

from fastapi import APIRouter, Depends, HTTPException, Query
from sqlalchemy.orm import Session

from app.auth.dependencies import get_current_user
from app.database import get_db
from app.models.user import User
from app.models.survey import MonitoringSite
from app.models.observation import SpeciesObservation, MediaAsset
from app.models.population import PopulationEstimate
from app.schemas.population import PopulationEstimateOut
from app.services.population_engine import estimate_population

router = APIRouter(prefix="/api/v1/population", tags=["Population Estimation Engine"])


@router.post("/assess/{monitoring_site_id}", response_model=List[PopulationEstimateOut], status_code=201)
def run_population_assessment(
    monitoring_site_id: str,
    area_sq_km: Optional[float] = Query(None, description="Optional site area for density calculation"),
    db: Session = Depends(get_db),
    _: User = Depends(get_current_user),
):
    """
    Computes fresh population estimates (per species) for a site from all
    recorded observations, and stores them. See population_engine.py module
    docstring for the honest limitations of this estimation approach.
    """
    site = db.query(MonitoringSite).filter(MonitoringSite.id == monitoring_site_id).first()
    if not site:
        raise HTTPException(status_code=404, detail="Monitoring site not found.")

    observations = (
        db.query(SpeciesObservation)
        .join(MediaAsset)
        .filter(MediaAsset.monitoring_site_id == monitoring_site_id)
        .all()
    )

    # Build a {species_name: previous_estimated_size} map from the most
    # recent prior estimate per species, to compute growth_rate_percent.
    previous_estimates = {}
    prior_rows = (
        db.query(PopulationEstimate)
        .filter(PopulationEstimate.monitoring_site_id == monitoring_site_id)
        .order_by(PopulationEstimate.assessed_at.desc())
        .all()
    )
    seen_species = set()
    for row in prior_rows:
        if row.species_common_name not in seen_species:
            previous_estimates[row.species_common_name] = row.estimated_population_size
            seen_species.add(row.species_common_name)

    results = estimate_population(observations, previous_estimates, area_sq_km)

    stored = []
    for r in results:
        estimate = PopulationEstimate(monitoring_site_id=monitoring_site_id, **r)
        db.add(estimate)
        stored.append(estimate)

    db.commit()
    for e in stored:
        db.refresh(e)

    return stored


@router.get("/{monitoring_site_id}/latest", response_model=List[PopulationEstimateOut])
def latest_population_estimates(
    monitoring_site_id: str,
    db: Session = Depends(get_db),
    _: User = Depends(get_current_user),
):
    """Returns the most recent population estimate per species for a site."""
    rows = (
        db.query(PopulationEstimate)
        .filter(PopulationEstimate.monitoring_site_id == monitoring_site_id)
        .order_by(PopulationEstimate.assessed_at.desc())
        .all()
    )
    latest_by_species = {}
    for row in rows:
        if row.species_common_name not in latest_by_species:
            latest_by_species[row.species_common_name] = row
    return list(latest_by_species.values())


@router.get("/{monitoring_site_id}/history", response_model=List[PopulationEstimateOut])
def population_history(
    monitoring_site_id: str,
    species_common_name: Optional[str] = None,
    db: Session = Depends(get_db),
    _: User = Depends(get_current_user),
):
    """Population trend / migration-adjacent history for a site, optionally filtered to one species."""
    query = db.query(PopulationEstimate).filter(PopulationEstimate.monitoring_site_id == monitoring_site_id)
    if species_common_name:
        query = query.filter(PopulationEstimate.species_common_name == species_common_name)
    return query.order_by(PopulationEstimate.assessed_at.desc()).all()


@router.get("/distribution")
def species_distribution(
    species_common_name: str,
    db: Session = Depends(get_db),
    _: User = Depends(get_current_user),
):
    """
    Species Distribution Mapping (spec section 6): returns every monitoring
    site (with GPS coordinates) where a given species has been observed,
    for plotting on a map.
    """
    site_ids = (
        db.query(SpeciesObservation.species_common_name, MediaAsset.monitoring_site_id)
        .join(MediaAsset)
        .filter(SpeciesObservation.species_common_name == species_common_name)
        .distinct()
        .all()
    )
    unique_site_ids = {row[1] for row in site_ids}
    sites = db.query(MonitoringSite).filter(MonitoringSite.id.in_(unique_site_ids)).all()

    return {
        "species_common_name": species_common_name,
        "site_count": len(sites),
        "sites": [
            {
                "id": s.id,
                "name": s.name,
                "latitude": s.latitude,
                "longitude": s.longitude,
                "habitat_type": s.habitat_type.value,
            }
            for s in sites
        ],
    }
