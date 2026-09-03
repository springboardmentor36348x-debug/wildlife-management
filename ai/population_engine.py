"""
Wildlife Population Intelligence Engine
Calculates observation-based population estimates, density, growth rates, and historical trends.
"""

from typing import List, Dict, Any, Optional
import math
from datetime import datetime, timedelta

class PopulationIntelligenceEngine:
    """Population analytics and estimation algorithms"""

    @staticmethod
    def calculate_density(count: int, area_km2: float) -> float:
        """Calculate population density (individuals per km2)"""
        if not area_km2 or area_km2 <= 0:
            return round(float(count) / 50.0, 3)
        return round(float(count) / float(area_km2), 3)

    @staticmethod
    def calculate_trend(data_points: List[Dict[str, Any]]) -> Dict[str, Any]:
        """
        Calculate population trend from historical points.
        Uses simple linear regression slope.
        """
        if not data_points or len(data_points) < 2:
            return {
                "trend": "Stable",
                "growth_rate_pct": 0.0,
                "confidence_level": "Low (Insufficient sample size)"
            }

        counts = [p.get("count", 1) for p in data_points]
        n = len(counts)
        x = list(range(n))
        y = counts

        # Linear regression slope: m = (n*sum(xy) - sum(x)*sum(y)) / (n*sum(x^2) - (sum(x))^2)
        sum_x = sum(x)
        sum_y = sum(y)
        sum_xy = sum(x[i] * y[i] for i in range(n))
        sum_x2 = sum(x[i] ** 2 for i in range(n))

        denom = (n * sum_x2) - (sum_x ** 2)
        if denom == 0:
            slope = 0.0
        else:
            slope = ((n * sum_xy) - (sum_x * sum_y)) / denom

        first_val = max(1, y[0])
        last_val = y[-1]
        growth_rate_pct = round(((last_val - first_val) / first_val) * 100.0, 1)

        if slope > 0.3 or growth_rate_pct > 10.0:
            trend = "Increasing"
        elif slope < -0.3 or growth_rate_pct < -10.0:
            trend = "Decreasing"
        else:
            trend = "Stable"

        confidence_level = "High" if n >= 5 else "Medium"

        return {
            "trend": trend,
            "growth_rate_pct": growth_rate_pct,
            "confidence_level": confidence_level,
            "slope": round(slope, 3)
        }

    @staticmethod
    def generate_simulated_historical_series(base_count: int, months: int = 6) -> List[Dict[str, Any]]:
        """Generate monthly trend time series for dashboard visualization"""
        series = []
        now = datetime.utcnow()
        for i in range(months, 0, -1):
            dt = now - timedelta(days=i * 30)
            factor = 1.0 + (math.sin(i) * 0.15)
            pt_count = max(2, int(base_count * factor))
            series.append({
                "date": dt.strftime("%b %Y"),
                "count": pt_count,
                "estimate": int(pt_count * 1.35),
                "density": round(pt_count / 100.0, 3)
            })
        return series

population_engine = PopulationIntelligenceEngine()
