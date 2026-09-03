"""
Conservation Recommendation Engine
Generates explainable, evidence-backed conservation strategies and priority actions.
"""

from typing import List, Dict, Any, Optional

class ConservationRecommendationEngine:
    """Explainable rule-based conservation decision support system"""

    @staticmethod
    def generate_recommendations(
        site_name: str,
        species_name: Optional[str],
        population_trend: str,
        habitat_quality: float,
        degradation_level: str,
        is_endangered: bool,
        overall_health: float
    ) -> List[Dict[str, Any]]:
        """
        Generate actionable recommendations with clear rationales.
        """
        recommendations = []

        # Rule 1: Endangered Species + Declining Population
        if is_endangered and population_trend.lower() == "decreasing":
            recommendations.append({
                "recommendation_type": "Anti-Poaching & Intensive Patrol",
                "title": f"Deploy Immediate Intensive Patrol Units for {species_name or 'Endangered Species'}",
                "priority": "Critical",
                "evidence": f"Encounter rates for {species_name or 'target species'} indicate declining trends while bearing Endangered IUCN conservation status in {site_name}.",
                "description": f"Establish high-frequency smart camera-trap perimeter and activate daily anti-poaching foot patrols along primary migratory corridors in {site_name}."
            })

        # Rule 2: High Habitat Degradation
        if degradation_level.lower() in ["high", "moderate"] or habitat_quality < 60.0:
            recommendations.append({
                "recommendation_type": "Corridor & Habitat Restoration",
                "title": f"Initiate Habitat Corridor Re-vegetation & Buffer Zone Protection",
                "priority": "High",
                "evidence": f"Habitat quality score is {habitat_quality}% with '{degradation_level}' degradation level detected in {site_name}.",
                "description": f"Restore native canopy flora, restrict unauthorized grazing/human encroachment, and establish water retention bodies to maintain prey-base carrying capacity."
            })

        # Rule 3: Declining general population or Low Health Score
        if overall_health < 65.0:
            recommendations.append({
                "recommendation_type": "Monitoring Grid Expansion",
                "title": "Double Camera Trap & Bioacoustic Sensor Density",
                "priority": "High",
                "evidence": f"Composite ecosystem health score stands at {overall_health}% (Moderate Concern / Vulnerable).",
                "description": "Increase spatial monitoring density across secondary grids to eliminate blind spots in nocturnal wildlife movement."
            })

        # Rule 4: Stable / Healthy Baseline Maintenance
        if overall_health >= 75.0 and population_trend.lower() != "decreasing":
            recommendations.append({
                "recommendation_type": "Routine Surveillance & Community Engagement",
                "title": "Maintain Baseline Surveillance & Eco-Development Programs",
                "priority": "Medium",
                "evidence": f"Ecosystem health score is {overall_health}% (Healthy/Optimal) with stable species demographic trends in {site_name}.",
                "description": "Continue standard seasonal line-transect censuses and maintain local tribal fringe community eco-development committees."
            })

        return recommendations

recommendation_engine = ConservationRecommendationEngine()
