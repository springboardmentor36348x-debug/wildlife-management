"""
Habitat Intelligence Engine
Assesses habitat quality, vegetation density, water availability, human disturbance, and degradation.
"""

from typing import Dict, Any

class HabitatIntelligenceEngine:
    """Habitat quality evaluation algorithms"""

    @staticmethod
    def evaluate_habitat(
        vegetation_score: float,
        water_source_score: float,
        human_disturbance_score: float,
        canopy_cover: float = 70.0
    ) -> Dict[str, Any]:
        """
        Calculates composite Habitat Quality Score.
        vegetation_score: 0-100
        water_source_score: 0-100
        human_disturbance_score: 0-100 (where 100 means heavy disturbance / bad)
        canopy_cover: 0-100 %
        """
        # Disturbance penalty: higher disturbance lowers habitat health
        disturbance_factor = max(0.0, 100.0 - human_disturbance_score)

        # Weighted calculation
        # 40% Vegetation, 30% Water Availability, 20% Low Disturbance, 10% Canopy
        quality_score = (
            (vegetation_score * 0.40) +
            (water_source_score * 0.30) +
            (disturbance_factor * 0.20) +
            (canopy_cover * 0.10)
        )
        quality_score = round(min(100.0, max(0.0, quality_score)), 1)

        # Degradation level classification
        if human_disturbance_score > 60 or quality_score < 45:
            degradation_level = "High"
            restoration_needed = True
            degradation_type = "Severe Encroachment / Deforestation"
        elif human_disturbance_score > 35 or quality_score < 65:
            degradation_level = "Moderate"
            restoration_needed = True
            degradation_type = "Fragmented Corridor / Water Stress"
        elif human_disturbance_score > 15 or quality_score < 80:
            degradation_level = "Low"
            restoration_needed = False
            degradation_type = "Minor Edge Disturbance"
        else:
            degradation_level = "None"
            restoration_needed = False
            degradation_type = "Pristine Core Zone"

        suitability_index = round(quality_score / 100.0, 2)

        return {
            "habitat_quality_score": quality_score,
            "vegetation_score": vegetation_score,
            "water_source_score": water_source_score,
            "human_disturbance_score": human_disturbance_score,
            "degradation_level": degradation_level,
            "degradation_type": degradation_type,
            "restoration_needed": restoration_needed,
            "suitability_index": suitability_index,
            "environmental_status": "Healthy / Optimal" if quality_score >= 75 else ("Fragile" if quality_score >= 55 else "Critical")
        }

habitat_engine = HabitatIntelligenceEngine()
