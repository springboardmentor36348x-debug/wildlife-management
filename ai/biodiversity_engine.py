"""
Biodiversity Intelligence Engine
Calculates Species Richness, Shannon-Wiener Index, Simpson's Index, Pielou's Evenness, and overall Biodiversity Health.
"""

from typing import List, Dict, Any
import math

class BiodiversityIntelligenceEngine:
    """Standard ecological biodiversity index calculations"""

    @staticmethod
    def calculate_indices(species_counts: Dict[str, int]) -> Dict[str, Any]:
        """
        Calculate Shannon Diversity, Simpson Index, Richness, and Evenness.
        species_counts: dict of {species_name_or_id: count_of_observations}
        """
        if not species_counts:
            return {
                "species_richness": 0,
                "shannon_diversity": 0.0,
                "simpson_diversity": 0.0,
                "evenness": 0.0,
                "total_observations": 0,
                "biodiversity_score": 0.0,
                "biodiversity_status": "Poor"
            }

        total_N = sum(species_counts.values())
        S = len(species_counts)  # Species richness

        if total_N == 0 or S == 0:
            return {
                "species_richness": 0,
                "shannon_diversity": 0.0,
                "simpson_diversity": 0.0,
                "evenness": 0.0,
                "total_observations": 0,
                "biodiversity_score": 0.0,
                "biodiversity_status": "Poor"
            }

        # Shannon-Wiener Index H' = - sum(p_i * ln(p_i))
        shannon = 0.0
        simpson_sum = 0.0

        for count in species_counts.values():
            if count > 0:
                p_i = count / total_N
                shannon -= p_i * math.log(p_i)
                simpson_sum += p_i ** 2

        # Simpson's Index of Diversity (1 - D)
        simpson_diversity = 1.0 - simpson_sum

        # Pielou's Evenness J = H' / ln(S)
        if S > 1:
            evenness = shannon / math.log(S)
        else:
            evenness = 1.0 if S == 1 else 0.0

        evenness = min(1.0, max(0.0, evenness))

        # Normalized Biodiversity Score (0 to 100)
        # Scaled using Shannon (typical max ~ 3.5 in wild surveys) and Evenness
        richness_component = min(1.0, S / 15.0) * 40.0
        shannon_component = min(1.0, shannon / 2.8) * 35.0
        evenness_component = evenness * 25.0
        biodiversity_score = round(richness_component + shannon_component + evenness_component, 1)

        if biodiversity_score >= 85:
            status = "Excellent"
        elif biodiversity_score >= 70:
            status = "Good"
        elif biodiversity_score >= 50:
            status = "Moderate Concern"
        else:
            status = "Poor"

        return {
            "species_richness": S,
            "shannon_diversity": round(shannon, 3),
            "simpson_diversity": round(simpson_diversity, 3),
            "evenness": round(evenness, 3),
            "total_observations": total_N,
            "biodiversity_score": biodiversity_score,
            "biodiversity_status": status
        }

biodiversity_engine = BiodiversityIntelligenceEngine()
