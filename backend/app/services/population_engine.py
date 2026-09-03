"""
Population Estimation Engine (Milestone 3, spec section 6).

HONEST LIMITATION (read before trusting these numbers): rigorous wildlife
population estimation in field ecology normally requires mark-recapture
studies, distance sampling, or multi-visit occupancy modelling - methods
that need specialized field protocols this platform doesn't implement.

What this engine actually does is a defensible first-order proxy: it derives
population size, density, and trend from the individual_count values already
recorded by the Image Analysis Engine and Bioacoustic Recognition Engine
across survey observations. This is useful directional signal (more
individuals observed per survey effort suggests a larger/growing local
population) but is NOT a substitute for a proper statistical estimator. Any
production deployment feeding real conservation decisions should validate
these numbers against field survey methodology before relying on them.
"""
from __future__ import annotations

from collections import defaultdict
from datetime import datetime
from typing import List, Optional

from app.models.observation import SpeciesObservation


def _trend_label(growth_rate_percent: Optional[float]) -> str:
    if growth_rate_percent is None:
        return "insufficient_data"
    if growth_rate_percent > 10:
        return "increasing"
    if growth_rate_percent < -10:
        return "declining"
    return "stable"


def estimate_population(
    observations: List[SpeciesObservation],
    previous_estimates_by_species: dict,
    area_sq_km: Optional[float] = None,
) -> List[dict]:
    """
    Computes a PopulationEstimate-shaped dict per species found in
    `observations`.

    previous_estimates_by_species: {species_common_name: estimated_population_size}
    from the prior assessment run, used to compute growth_rate_percent.
    Pass an empty dict on the first-ever assessment for a site.
    """
    by_species: dict[str, List[SpeciesObservation]] = defaultdict(list)
    for obs in observations:
        by_species[obs.species_common_name].append(obs)

    results = []
    for species_name, obs_list in by_species.items():
        estimated_size = float(sum(o.individual_count for o in obs_list))
        density = round(estimated_size / area_sq_km, 3) if area_sq_km and area_sq_km > 0 else None

        previous_size = previous_estimates_by_species.get(species_name)
        growth_rate = None
        if previous_size is not None and previous_size > 0:
            growth_rate = round(((estimated_size - previous_size) / previous_size) * 100, 2)

        results.append({
            "species_common_name": species_name,
            "species_scientific_name": obs_list[0].species_scientific_name,
            "estimated_population_size": estimated_size,
            "population_density": density,
            "growth_rate_percent": growth_rate,
            "trend_label": _trend_label(growth_rate),
            "observation_count": float(len(obs_list)),
        })

    return results
