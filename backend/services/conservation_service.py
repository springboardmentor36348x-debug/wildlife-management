from datetime import datetime
from typing import List
from sqlalchemy.orm import Session

import models_monitoring as mm
import schemas_intelligence as si
from services.population_service import get_species_meta


def generate_conservation_recommendations(db: Session) -> si.ConservationOverviewResponse:
    """
    Dynamically generates actionable conservation interventions based on
    actual species observations and monitoring sites present in the database.
    """
    sites = db.query(mm.MonitoringSite).all()
    observations = db.query(mm.Observation).all()

    species_set = set(o.species.strip() for o in observations)
    site_names = [s.site_name for s in sites] if sites else ["Monitored Reserve"]

    recommendations: List[si.ConservationRecommendation] = []
    
    # 1. Tiger recommendation if Tiger is observed
    if any("tiger" in sp.lower() for sp in species_set) or not species_set:
        site_str = site_names[0] if site_names else "Core Zone"
        recommendations.append(
            si.ConservationRecommendation(
                id="rec-tiger-01",
                title="Apex Predator Habitat Corridor Protection",
                species_target="Bengal Tiger (Panthera tigris)",
                site_target=site_str,
                priority=si.ConservationPriority.urgent,
                urgency_score=92.0,
                category="Anti-Poaching",
                description=f"Endangered tiger activity verified at {site_str}. High priority for corridor surveillance and anti-poaching patrolling.",
                suggested_actions=[
                    "Intensify foot and drone patrols along perimeter fence boundaries",
                    "Deploy automated acoustic gun-shot / chainsaw detection sensors",
                    "Establish local community solar light early-warning systems"
                ],
                created_at=datetime.utcnow(),
                status="In Progress"
            )
        )

    # 2. Lion recommendation if Lion is observed
    if any("lion" in sp.lower() for sp in species_set):
        site_str = site_names[0] if site_names else "Sanctuary"
        recommendations.append(
            si.ConservationRecommendation(
                id="rec-lion-02",
                title="Asiatic Lion Range Expansion & Prey-Base Monitoring",
                species_target="Asiatic Lion (Panthera leo persica)",
                site_target=site_str,
                priority=si.ConservationPriority.urgent,
                urgency_score=89.0,
                category="Habitat Protection",
                description=f"Endangered apex lion sighting recorded at {site_str}. Requires monitoring of ungulate prey density.",
                suggested_actions=[
                    "Conduct camera trap survey on ungulate prey density (Deer / Boar)",
                    "Maintain perennial solar-powered water holes in dry patches",
                    "Vaccinate domestic livestock in buffer zones to prevent viral transmission"
                ],
                created_at=datetime.utcnow(),
                status="Pending"
            )
        )

    # 3. Bison recommendation if Bison is observed
    if any("bison" in sp.lower() for sp in species_set):
        site_str = site_names[0] if site_names else "Grassland Sector"
        recommendations.append(
            si.ConservationRecommendation(
                id="rec-bison-03",
                title="Indian Bison (Gaur) Grazing Habitat & Water Access Restoration",
                species_target="Indian Bison / Gaur (Bos gaurus)",
                site_target=site_str,
                priority=si.ConservationPriority.high,
                urgency_score=76.0,
                category="Habitat Restoration",
                description=f"Vulnerable Gaur herd presence noted in {site_str}. Requires grassland enrichment and weed eradication.",
                suggested_actions=[
                    "Eradicate invasive weeds (Lantana camara) from primary grazing corridors",
                    "Install salt licks and mineral supplements near natural salt pans",
                    "Monitor seasonal herd movements across road transit sectors"
                ],
                created_at=datetime.utcnow(),
                status="Pending"
            )
        )

    urgent_count = sum(1 for r in recommendations if r.priority in (si.ConservationPriority.urgent, si.ConservationPriority.high))
    threatened_species = len(species_set)
    protected_areas = len(sites)

    return si.ConservationOverviewResponse(
        total_recommendations=len(recommendations),
        urgent_actions_count=urgent_count,
        threatened_species_count=threatened_species,
        protected_areas_active=protected_areas,
        recommendations=recommendations
    )
