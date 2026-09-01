"""
GIS Map Visualization API Router (Milestone 4, Feature 6).
Provides GeoJSON FeatureCollection endpoints for map layer rendering:
- Monitoring sites / sensor devices
- Species distribution
- Habitat classification & degradation zones
- Ecosystem health-score overlays
- Wildlife movement / migration paths
- Protected area boundaries
"""
from fastapi import APIRouter, Depends
from sqlalchemy.orm import Session

from app.core.deps import get_current_user
from app.db.session import get_db
from app.models.user import User
from app.models.survey import MonitoringSite, Survey
from app.models.observation import Observation
from app.services import (
    population_service,
    habitat_service,
    health_score_service,
)

router = APIRouter(prefix="/gis", tags=["GIS Map Visualization Layer"])


@router.get("/sensors")
def get_sensor_locations(
    survey_id: str | None = None,
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user),
):
    """GeoJSON FeatureCollection of all camera traps, audio nodes, and drone monitoring sites."""
    query = db.query(MonitoringSite)
    if survey_id:
        query = query.filter(MonitoringSite.survey_id == survey_id)
    sites = query.all()

    features = []
    for s in sites:
        features.append({
            "type": "Feature",
            "geometry": {
                "type": "Point",
                "coordinates": [s.longitude, s.latitude],
            },
            "properties": {
                "id": s.id,
                "name": s.site_name,
                "survey_id": s.survey_id,
                "survey_name": s.survey.name if s.survey else None,
                "device_type": s.monitoring_device.value if hasattr(s.monitoring_device, "value") else str(s.monitoring_device),
                "habitat_type": s.habitat_type.value if hasattr(s.habitat_type, "value") else str(s.habitat_type),
                "protected_area": s.protected_area or "Unassigned",
                "is_active": s.is_active == "true",
                "observation_count": len(s.observations),
            },
        })

    return {
        "type": "FeatureCollection",
        "features": features,
    }


@router.get("/species-distribution")
def get_species_distribution_layer(
    survey_id: str | None = None,
    species: str | None = None,
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user),
):
    """GeoJSON FeatureCollection of species detections and concentrations per monitoring site."""
    distribution = population_service.get_species_distribution(db, survey_id=survey_id)
    features = []

    for d in distribution:
        counts = d["species_counts"]
        if species:
            counts = [c for c in counts if c["species"].lower() == species.lower()]
            if not counts:
                continue

        total_detections = sum(c["count"] for c in counts)
        top_sp = counts[0]["species"] if counts else "None"

        features.append({
            "type": "Feature",
            "geometry": {
                "type": "Point",
                "coordinates": [d["longitude"], d["latitude"]],
            },
            "properties": {
                "site_id": d["site_id"],
                "site_name": d["site_name"],
                "total_detections": total_detections,
                "top_species": top_sp,
                "species_counts": counts,
            },
        })

    return {
        "type": "FeatureCollection",
        "features": features,
    }


@router.get("/habitat-zones")
def get_habitat_zones_layer(
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user),
):
    """GeoJSON FeatureCollection of habitat classification & degradation indicators per site."""
    sites = db.query(MonitoringSite).all()
    features = []

    for s in sites:
        htype = habitat_service.classify_habitat(s)
        deg = habitat_service.detect_habitat_degradation(db, site_id=s.id)
        
        # Color mapping helper
        habitat_colors = {
            "forest": "#15803d",
            "grassland": "#eab308",
            "wetland": "#0284c7",
            "riverine": "#06b6d4",
            "mountain": "#78716c",
            "marine": "#2563eb",
            "other": "#64748b",
        }

        features.append({
            "type": "Feature",
            "geometry": {
                "type": "Point",
                "coordinates": [s.longitude, s.latitude],
            },
            "properties": {
                "site_id": s.id,
                "site_name": s.site_name,
                "habitat_type": htype,
                "habitat_color": habitat_colors.get(htype.lower(), "#64748b"),
                "degradation_status": deg.get("status", "insufficient_data"),
                "change_pct": deg.get("change_pct"),
                "recent_obs": deg.get("recent_count", 0),
                "is_declining": deg.get("status") == "declining",
            },
        })

    return {
        "type": "FeatureCollection",
        "features": features,
    }


@router.get("/health-scores")
def get_health_score_layer(
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user),
):
    """GeoJSON FeatureCollection with ecosystem health score color-coded overlays."""
    scores = health_score_service.calculate_ecosystem_health_all_sites(db)
    sites_by_id = {s.id: s for s in db.query(MonitoringSite).all()}

    status_color_map = {
        "Excellent": "#10B981",       # emerald
        "Healthy": "#34D399",         # green
        "Moderate Concern": "#FBBF24",# amber
        "Vulnerable": "#F97316",      # orange
        "Critical": "#EF4444",        # red
    }

    features = []
    for h in scores:
        site = sites_by_id.get(h["site_id"])
        if not site:
            continue

        status = h.get("conservation_status", "Critical")
        features.append({
            "type": "Feature",
            "geometry": {
                "type": "Point",
                "coordinates": [site.longitude, site.latitude],
            },
            "properties": {
                "site_id": site.id,
                "site_name": site.site_name,
                "ecosystem_health_score": h.get("ecosystem_health_score", 0),
                "conservation_status": status,
                "status_color": status_color_map.get(status, "#EF4444"),
                "components": h.get("components", {}),
            },
        })

    return {
        "type": "FeatureCollection",
        "features": features,
    }


@router.get("/migration-paths")
def get_migration_paths_layer(
    species: str | None = None,
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user),
):
    """
    GeoJSON FeatureCollection containing LineStrings connecting sequential site
    observations chronologically for a species.
    """
    if not species:
        top_sp = db.query(Observation.species_label).filter(Observation.species_label.isnot(None)).first()
        species = top_sp[0] if top_sp else "elephant"

    movement = population_service.get_species_site_movement(db, species_label=species)
    features = []

    if len(movement) >= 2:
        coords = [[m["longitude"], m["latitude"]] for m in movement]
        features.append({
            "type": "Feature",
            "geometry": {
                "type": "LineString",
                "coordinates": coords,
            },
            "properties": {
                "species": species,
                "total_waypoints": len(movement),
                "sites_sequence": [m["site_name"] for m in movement],
                "start_site": movement[0]["site_name"],
                "end_site": movement[-1]["site_name"],
                "first_seen": movement[0]["first_observed_at"],
                "last_seen": movement[-1]["first_observed_at"],
            },
        })

    for i, m in enumerate(movement):
        features.append({
            "type": "Feature",
            "geometry": {
                "type": "Point",
                "coordinates": [m["longitude"], m["latitude"]],
            },
            "properties": {
                "point_type": "migration_waypoint",
                "step_order": i + 1,
                "species": species,
                "site_id": m["site_id"],
                "site_name": m["site_name"],
                "observation_count": m["observation_count"],
                "first_observed_at": m["first_observed_at"],
            },
        })

    return {
        "type": "FeatureCollection",
        "features": features,
    }


@router.get("/protected-areas")
def get_protected_areas_layer(
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user),
):
    """GeoJSON FeatureCollection representing protected area clusters & boundaries."""
    sites = db.query(MonitoringSite).all()
    areas: dict[str, list[MonitoringSite]] = {}
    for s in sites:
        pname = s.protected_area or s.survey.protected_area if s.survey else None
        if pname:
            areas.setdefault(pname, []).append(s)

    features = []
    for name, area_sites in areas.items():
        avg_lat = sum(s.latitude for s in area_sites) / len(area_sites)
        avg_lon = sum(s.longitude for s in area_sites) / len(area_sites)
        features.append({
            "type": "Feature",
            "geometry": {
                "type": "Point",
                "coordinates": [avg_lon, avg_lat],
            },
            "properties": {
                "protected_area_name": name,
                "sites_count": len(area_sites),
                "sites": [s.site_name for s in area_sites],
            },
        })

    return {
        "type": "FeatureCollection",
        "features": features,
    }


@router.get("/all-layers")
def get_all_gis_layers(
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user),
):
    """Convenience bundle returning all GIS layers in a single call for high-speed dashboard initial load."""
    return {
        "sensors": get_sensor_locations(db=db, current_user=current_user),
        "species_distribution": get_species_distribution_layer(db=db, current_user=current_user),
        "habitat_zones": get_habitat_zones_layer(db=db, current_user=current_user),
        "health_scores": get_health_score_layer(db=db, current_user=current_user),
        "protected_areas": get_protected_areas_layer(db=db, current_user=current_user),
    }
