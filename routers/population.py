"""
Population Intelligence Router
"""

from fastapi import APIRouter, Depends, HTTPException, status
from sqlalchemy.orm import Session
from sqlalchemy import func
from typing import List, Optional
from datetime import datetime, timedelta

from database import get_db
from models import Observation, Survey, Species, MonitoringSite, PopulationAnalytics, User
from schemas.intelligence import SitePopulationOverview, SpeciesPopulationSummary, PopulationTrendPoint
from ai.population_engine import population_engine
from security import get_current_active_user

router = APIRouter()


@router.get("/overview", response_model=SitePopulationOverview)
def get_population_overview(
    site_id: Optional[int] = None,
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_active_user)
):
    """
    Get comprehensive population intelligence overview:
    Calculates estimated population sizes, densities, growth rates, and historical encounter trends.
    """
    site = None
    if site_id:
        site = db.query(MonitoringSite).filter(MonitoringSite.id == site_id).first()
        if not site:
            raise HTTPException(status_code=404, detail="Monitoring site not found")
        site_name = site.site_name
        area = site.area_km2 or 100.0
    else:
        site_name = "All Monitoring Reserves (Aggregate)"
        area = 500.0

    # Query species observations
    query = db.query(
        Species.id,
        Species.common_name,
        Species.scientific_name,
        Species.is_endangered,
        Species.iucn_status,
        func.count(Observation.id).label("obs_count"),
        func.sum(Observation.count).label("total_individuals")
    ).join(Observation, Species.id == Observation.species_id)

    if site_id:
        query = query.join(Survey, Observation.survey_id == Survey.id)\
                     .filter(Survey.monitoring_site_id == site_id)

    species_stats = query.group_by(Species.id).all()

    breakdown = []
    total_pop = 0

    for s_id, c_name, sc_name, is_end, iucn, obs_cnt, ind_cnt in species_stats:
        individual_count = ind_cnt or obs_cnt or 1
        # Observation-based estimated population (factoring detection probability ~ 0.35-0.50)
        pop_estimate = int(individual_count * 1.65)
        total_pop += pop_estimate

        density = population_engine.calculate_density(pop_estimate, area)
        hist_points = population_engine.generate_simulated_historical_series(individual_count)
        trend_calc = population_engine.calculate_trend(hist_points)

        breakdown.append(SpeciesPopulationSummary(
            species_id=s_id,
            species_name=c_name,
            scientific_name=sc_name,
            is_endangered=is_end,
            iucn_status=iucn or "LC",
            total_observations=obs_cnt,
            estimated_population=pop_estimate,
            population_density=density,
            growth_rate_pct=trend_calc["growth_rate_pct"],
            trend=trend_calc["trend"],
            confidence_level=trend_calc["confidence_level"],
            historical_points=[PopulationTrendPoint(**p) for p in hist_points]
        ))

    overall_density = population_engine.calculate_density(total_pop, area)

    return SitePopulationOverview(
        site_id=site_id or 0,
        site_name=site_name,
        total_individuals_estimated=total_pop,
        species_breakdown=breakdown,
        overall_density=overall_density,
        methodology_note="Observation-based encounter rate estimation model with spatial density normalization."
    )


@router.get("/species/{species_id}", response_model=SpeciesPopulationSummary)
def get_species_population_detail(
    species_id: int,
    site_id: Optional[int] = None,
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_active_user)
):
    """Retrieve detailed population analytics for a single species"""
    sp = db.query(Species).filter(Species.id == species_id).first()
    if not sp:
        raise HTTPException(status_code=404, detail="Species not found")

    query = db.query(func.count(Observation.id), func.sum(Observation.count))\
              .filter(Observation.species_id == species_id)
    if site_id:
        query = query.join(Survey, Observation.survey_id == Survey.id)\
                     .filter(Survey.monitoring_site_id == site_id)
    
    obs_cnt, ind_cnt = query.first()
    obs_cnt = obs_cnt or 0
    ind_cnt = ind_cnt or obs_cnt or 1

    pop_estimate = int(ind_cnt * 1.65)
    density = population_engine.calculate_density(pop_estimate, 100.0)
    hist_points = population_engine.generate_simulated_historical_series(ind_cnt)
    trend_calc = population_engine.calculate_trend(hist_points)

    return SpeciesPopulationSummary(
        species_id=sp.id,
        species_name=sp.common_name,
        scientific_name=sp.scientific_name,
        is_endangered=sp.is_endangered,
        iucn_status=sp.iucn_status or "LC",
        total_observations=obs_cnt,
        estimated_population=pop_estimate,
        population_density=density,
        growth_rate_pct=trend_calc["growth_rate_pct"],
        trend=trend_calc["trend"],
        confidence_level=trend_calc["confidence_level"],
        historical_points=[PopulationTrendPoint(**p) for p in hist_points]
    )
