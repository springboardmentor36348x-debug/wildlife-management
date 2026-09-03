"""
Wildlife Health Scoring Engine (Official 5-Component Weighted Model)
Weights:
- Species Diversity:          30%
- Population Stability:       25%
- Habitat Quality:            20%
- Endangered Species Status:  15%
- Environmental Conditions:   10%
"""

from typing import Dict, Any

class WildlifeHealthScoringEngine:
    """Ecosystem Health Scoring based on official project specification"""

    WEIGHTS = {
        "species_diversity": 0.30,
        "population_stability": 0.25,
        "habitat_quality": 0.20,
        "endangered_species": 0.15,
        "environmental_conditions": 0.10
    }

    @staticmethod
    def calculate_health_score(
        species_diversity_score: float,
        population_stability_score: float,
        habitat_quality_score: float,
        endangered_species_score: float,
        environmental_conditions_score: float
    ) -> Dict[str, Any]:
        """
        Calculate overall weighted ecosystem health score and classify category.
        All input scores are 0-100.
        """
        # Clamp inputs between 0 and 100
        d_score = min(100.0, max(0.0, float(species_diversity_score)))
        p_score = min(100.0, max(0.0, float(population_stability_score)))
        h_score = min(100.0, max(0.0, float(habitat_quality_score)))
        e_score = min(100.0, max(0.0, float(endangered_species_score)))
        c_score = min(100.0, max(0.0, float(environmental_conditions_score)))

        overall = (
            (d_score * 0.30) +
            (p_score * 0.25) +
            (h_score * 0.20) +
            (e_score * 0.15) +
            (c_score * 0.10)
        )
        overall_rounded = round(overall, 1)

        # Classification based on PDF specifications
        if overall_rounded >= 90.0:
            health_status = "Excellent"
            status_color = "emerald"
            description = "Ecosystem is in pristine balance with flourishing biodiversity and high stability."
        elif overall_rounded >= 75.0:
            health_status = "Healthy"
            status_color = "green"
            description = "Ecosystem exhibits robust health, sustainable populations, and good habitat integrity."
        elif overall_rounded >= 60.0:
            health_status = "Moderate Concern"
            status_color = "amber"
            description = "Signs of localized habitat degradation or population stagnation observed. Increased monitoring advised."
        elif overall_rounded >= 40.0:
            health_status = "Vulnerable"
            status_color = "orange"
            description = "Ecosystem under notable stress with declining trends or habitat fragmentation."
        else:
            health_status = "Critical"
            status_color = "red"
            description = "Urgent conservation intervention required. Severe habitat loss or rapid population decline detected."

        return {
            "species_diversity_score": round(d_score, 1),
            "population_stability_score": round(p_score, 1),
            "habitat_quality_score": round(h_score, 1),
            "endangered_species_score": round(e_score, 1),
            "environmental_conditions_score": round(c_score, 1),
            "overall_health_score": overall_rounded,
            "health_status": health_status,
            "status_color": status_color,
            "description": description,
            "weights": WildlifeHealthScoringEngine.WEIGHTS
        }

health_scoring_engine = WildlifeHealthScoringEngine()
