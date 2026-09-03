from typing import List

from fastapi import APIRouter, Depends, HTTPException
from sqlalchemy.orm import Session

from app.auth.dependencies import get_current_user
from app.database import get_db
from app.models.user import User
from app.models.survey import MonitoringSite
from app.models.observation import SpeciesObservation, MediaAsset, ConservationStatus
from app.models.biodiversity import BiodiversityAssessment
from app.models.habitat import HabitatAssessment
from app.models.population import PopulationEstimate
from app.models.conservation import ConservationRecommendation
from app.schemas.conservation import ConservationRecommendationOut, RecommendationStatusUpdate
from app.services.conservation_engine import generate_recommendations

router = APIRouter(prefix="/api/v1/conservation", tags=["Conservation Recommendation Engine"])


@router.post("/generate/{monitoring_site_id}", response_model=List[ConservationRecommendationOut], status_code=201)
def generate_site_recommendations(
    monitoring_site_id: str,
    db: Session = Depends(get_db),
    _: User = Depends(get_current_user),
):
    """
    Generates fresh conservation recommendations for a site by reading the
    latest outputs of the Biodiversity, Habitat, and Population Intelligence
    Engines. Run those assessments first for the richest recommendations -
    this endpoint degrades gracefully (see conservation_engine.py) if some
    of them haven't been run yet for this site.
    """
    site = db.query(MonitoringSite).filter(MonitoringSite.id == monitoring_site_id).first()
    if not site:
        raise HTTPException(status_code=404, detail="Monitoring site not found.")

    latest_biodiversity = (
        db.query(BiodiversityAssessment)
        .filter(BiodiversityAssessment.monitoring_site_id == monitoring_site_id)
        .order_by(BiodiversityAssessment.assessed_at.desc())
        .first()
    )
    latest_habitat = (
        db.query(HabitatAssessment)
        .filter(HabitatAssessment.monitoring_site_id == monitoring_site_id)
        .order_by(HabitatAssessment.assessed_at.desc())
        .first()
    )

    endangered_species = (
        db.query(SpeciesObservation.species_common_name)
        .join(MediaAsset)
        .filter(
            MediaAsset.monitoring_site_id == monitoring_site_id,
            SpeciesObservation.conservation_status.in_([
                ConservationStatus.ENDANGERED,
                ConservationStatus.CRITICALLY_ENDANGERED,
            ]),
        )
        .distinct()
        .all()
    )
    endangered_names = [row[0] for row in endangered_species]

    declining_rows = (
        db.query(PopulationEstimate.species_common_name)
        .filter(
            PopulationEstimate.monitoring_site_id == monitoring_site_id,
            PopulationEstimate.trend_label == "declining",
        )
        .distinct()
        .all()
    )
    declining_names = [row[0] for row in declining_rows]

    recommendations = generate_recommendations(
        biodiversity=latest_biodiversity,
        habitat=latest_habitat,
        endangered_species_names=endangered_names,
        population_declining_species=declining_names,
    )

    stored = []
    for rec in recommendations:
        row = ConservationRecommendation(monitoring_site_id=monitoring_site_id, **rec)
        db.add(row)
        stored.append(row)

    db.commit()
    for r in stored:
        db.refresh(r)

    return stored


@router.get("/{monitoring_site_id}", response_model=List[ConservationRecommendationOut])
def list_site_recommendations(
    monitoring_site_id: str,
    db: Session = Depends(get_db),
    _: User = Depends(get_current_user),
):
    return (
        db.query(ConservationRecommendation)
        .filter(ConservationRecommendation.monitoring_site_id == monitoring_site_id)
        .order_by(ConservationRecommendation.generated_at.desc())
        .all()
    )


@router.patch("/{recommendation_id}/status", response_model=ConservationRecommendationOut)
def update_recommendation_status(
    recommendation_id: str,
    payload: RecommendationStatusUpdate,
    db: Session = Depends(get_db),
    _: User = Depends(get_current_user),
):
    """Lets a conservation officer mark a recommendation as in_progress/resolved."""
    rec = db.query(ConservationRecommendation).filter(ConservationRecommendation.id == recommendation_id).first()
    if not rec:
        raise HTTPException(status_code=404, detail="Recommendation not found.")
    if payload.status not in ("open", "in_progress", "resolved"):
        raise HTTPException(status_code=400, detail="status must be one of: open, in_progress, resolved")
    rec.is_resolved = payload.status
    db.commit()
    db.refresh(rec)
    return rec
