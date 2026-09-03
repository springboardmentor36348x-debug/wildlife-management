"""
GIS Spatial Analytics and Maps Router
"""

from fastapi import APIRouter, Depends, HTTPException, status
from sqlalchemy.orm import Session
from sqlalchemy import func
from typing import Dict, Any, List, Optional

from database import get_db
from models import MonitoringSite, Observation, Survey, Species, User
from security import get_current_active_user

router = APIRouter()


@router.get("/sites-geojson")
def get_sites_geojson(
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_active_user)
):
    """
    Returns monitoring sites formatted as a GeoJSON FeatureCollection
    for Leaflet mapping.
    """
    sites = db.query(MonitoringSite).filter(MonitoringSite.is_active == True).all()
    
    features = []
    for s in sites:
        # Aggregate stats
        obs_cnt = db.query(func.count(Observation.id))\
            .join(Survey, Observation.survey_id == Survey.id)\
            .filter(Survey.monitoring_site_id == s.id)\
            .scalar() or 0

        features.append({
            "type": "Feature",
            "geometry": {
                "type": "Point",
                "coordinates": [s.longitude, s.latitude]  # GeoJSON is [lon, lat]
            },
            "properties": {
                "id": s.id,
                "site_name": s.site_name,
                "site_code": s.site_code,
                "habitat_type": s.habitat_type.value if hasattr(s.habitat_type, 'value') else str(s.habitat_type),
                "area_km2": s.area_km2,
                "is_protected_area": s.is_protected_area,
                "protection_status": s.protection_status,
                "observation_count": obs_cnt
            }
        })

    return {
        "type": "FeatureCollection",
        "features": features
    }


@router.get("/observations-heatmap")
def get_observations_heatmap(
    species_id: Optional[int] = None,
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_active_user)
):
    """
    Returns observations coordinates with species name and confidence score
    for rendering spatial hotspots.
    """
    query = db.query(Observation).filter(
        Observation.latitude.isnot(None),
        Observation.longitude.isnot(None)
    )

    if species_id:
        query = query.filter(Observation.species_id == species_id)

    observations = query.all()

    features = []
    for o in observations:
        features.append({
            "type": "Feature",
            "geometry": {
                "type": "Point",
                "coordinates": [o.longitude, o.latitude]
            },
            "properties": {
                "id": o.id,
                "observation_id": o.observation_id,
                "species_name": o.species.common_name if o.species else "Unknown Wildlife",
                "count": o.count or 1,
                "confidence": o.confidence_score,
                "date": o.observation_date.strftime("%Y-%m-%d %H:%M"),
                "type": o.observation_type
            }
        })

    return {
        "type": "FeatureCollection",
        "features": features
    }
