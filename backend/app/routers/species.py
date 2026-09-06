from typing import List, Optional

from fastapi import APIRouter, Depends, Query
from sqlalchemy import func
from sqlalchemy.orm import Session

from app.auth.dependencies import get_current_user
from app.database import get_db
from app.models.user import User
from app.models.observation import SpeciesObservation, SpeciesGroup
from app.schemas.observation import SpeciesObservationOut

router = APIRouter(prefix="/api/v1/species", tags=["Species Identification Engine"])


@router.get("/observations", response_model=List[SpeciesObservationOut])
def list_observations(
    monitoring_site_id: Optional[str] = None,
    species_group: Optional[SpeciesGroup] = None,
    min_confidence: float = Query(0.0, ge=0.0, le=1.0),
    db: Session = Depends(get_db),
    _: User = Depends(get_current_user),
):
    """
    Unified species observation feed - combines detections from the
    Image Analysis Engine and the Bioacoustic Recognition Engine.
    """
    query = db.query(SpeciesObservation).filter(SpeciesObservation.confidence_score >= min_confidence)
    if species_group:
        query = query.filter(SpeciesObservation.species_group == species_group)
    if monitoring_site_id:
        # join through media_asset for site filtering
        from app.models.observation import MediaAsset
        query = query.join(MediaAsset).filter(MediaAsset.monitoring_site_id == monitoring_site_id)

    return query.order_by(SpeciesObservation.detected_at.desc()).limit(500).all()


@router.get("/summary")
def species_summary(db: Session = Depends(get_db), _: User = Depends(get_current_user)):
    """
    Species Identification Engine summary: distinct species count,
    per-species detection totals, and endangered species flagged.
    """
    rows = (
        db.query(
            SpeciesObservation.species_common_name,
            SpeciesObservation.species_group,
            SpeciesObservation.conservation_status,
            func.count(SpeciesObservation.id).label("detection_count"),
            func.sum(SpeciesObservation.individual_count).label("total_individuals"),
            func.avg(SpeciesObservation.confidence_score).label("avg_confidence"),
        )
        .group_by(
            SpeciesObservation.species_common_name,
            SpeciesObservation.species_group,
            SpeciesObservation.conservation_status,
        )
        .all()
    )

    species_list = [
        {
            "species_common_name": r.species_common_name,
            "species_group": r.species_group.value if r.species_group else None,
            "conservation_status": r.conservation_status.value if r.conservation_status else None,
            "detection_count": r.detection_count,
            "total_individuals": int(r.total_individuals or 0),
            "avg_confidence": round(float(r.avg_confidence or 0), 3),
        }
        for r in rows
    ]

    endangered = [
        s for s in species_list
        if s["conservation_status"] in ("endangered", "critically_endangered", "vulnerable")
    ]

    return {
        "total_distinct_species": len(species_list),
        "species": species_list,
        "endangered_species_alerts": endangered,
    }
