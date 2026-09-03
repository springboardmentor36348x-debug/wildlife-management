"""
Habitat Intelligence Router
"""

from fastapi import APIRouter, Depends, HTTPException, status
from sqlalchemy.orm import Session
from typing import Optional, List
from datetime import datetime

from database import get_db
from models import MonitoringSite, HabitatAssessment, HabitatThreat, User
from schemas.intelligence import HabitatAssessmentRequest, HabitatAssessmentResponse
from ai.habitat_engine import habitat_engine
from security import get_current_active_user

router = APIRouter()


@router.get("/assessment", response_model=HabitatAssessmentResponse)
def get_habitat_assessment(
    site_id: int,
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_active_user)
):
    """Get latest habitat health assessment for a monitoring site"""
    site = db.query(MonitoringSite).filter(MonitoringSite.id == site_id).first()
    if not site:
        raise HTTPException(status_code=404, detail="Monitoring site not found")

    assessment = db.query(HabitatAssessment)\
        .filter(HabitatAssessment.monitoring_site_id == site_id)\
        .order_by(HabitatAssessment.assessment_date.desc())\
        .first()

    if assessment:
        eval_result = habitat_engine.evaluate_habitat(
            vegetation_score=assessment.vegetation_score or 80.0,
            water_source_score=assessment.water_source_score or 75.0,
            human_disturbance_score=assessment.human_disturbance_score or 15.0
        )
        return HabitatAssessmentResponse(
            site_id=site.id,
            site_name=site.site_name,
            habitat_type=site.habitat_type.value if hasattr(site.habitat_type, 'value') else str(site.habitat_type),
            assessment_date=assessment.assessment_date,
            habitat_quality_score=assessment.habitat_quality_score or eval_result["habitat_quality_score"],
            vegetation_score=assessment.vegetation_score or 80.0,
            water_source_score=assessment.water_source_score or 75.0,
            human_disturbance_score=assessment.human_disturbance_score or 15.0,
            degradation_level=assessment.degradation_level or eval_result["degradation_level"],
            degradation_type=assessment.degradation_type or eval_result["degradation_type"],
            restoration_needed=assessment.restoration_needed or eval_result["restoration_needed"],
            suitability_index=eval_result["suitability_index"],
            environmental_status=eval_result["environmental_status"]
        )

    # If no recorded assessment, compute default baseline
    eval_result = habitat_engine.evaluate_habitat(82.0, 78.0, 18.0, 75.0)
    return HabitatAssessmentResponse(
        site_id=site.id,
        site_name=site.site_name,
        habitat_type=site.habitat_type.value if hasattr(site.habitat_type, 'value') else str(site.habitat_type),
        assessment_date=datetime.utcnow(),
        habitat_quality_score=eval_result["habitat_quality_score"],
        vegetation_score=82.0,
        water_source_score=78.0,
        human_disturbance_score=18.0,
        degradation_level=eval_result["degradation_level"],
        degradation_type=eval_result["degradation_type"],
        restoration_needed=eval_result["restoration_needed"],
        suitability_index=eval_result["suitability_index"],
        environmental_status=eval_result["environmental_status"]
    )


@router.post("/assessment", response_model=HabitatAssessmentResponse)
def submit_habitat_assessment(
    req: HabitatAssessmentRequest,
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_active_user)
):
    """Submit habitat field measurements and calculate quality score"""
    site = db.query(MonitoringSite).filter(MonitoringSite.id == req.site_id).first()
    if not site:
        raise HTTPException(status_code=404, detail="Monitoring site not found")

    eval_result = habitat_engine.evaluate_habitat(
        vegetation_score=req.vegetation_quality,
        water_source_score=req.water_availability,
        human_disturbance_score=req.human_disturbance,
        canopy_cover=req.canopy_cover_pct or 70.0
    )

    assessment = HabitatAssessment(
        monitoring_site_id=req.site_id,
        assessment_date=datetime.utcnow(),
        habitat_quality_score=eval_result["habitat_quality_score"],
        vegetation_score=req.vegetation_quality,
        water_source_score=req.water_availability,
        human_disturbance_score=req.human_disturbance,
        degradation_level=eval_result["degradation_level"],
        degradation_type=req.degradation_type or eval_result["degradation_type"],
        restoration_needed=eval_result["restoration_needed"],
        notes=req.notes
    )
    db.add(assessment)
    db.commit()

    return HabitatAssessmentResponse(
        site_id=site.id,
        site_name=site.site_name,
        habitat_type=site.habitat_type.value if hasattr(site.habitat_type, 'value') else str(site.habitat_type),
        assessment_date=assessment.assessment_date,
        habitat_quality_score=eval_result["habitat_quality_score"],
        vegetation_score=req.vegetation_quality,
        water_source_score=req.water_availability,
        human_disturbance_score=req.human_disturbance,
        degradation_level=eval_result["degradation_level"],
        degradation_type=eval_result["degradation_type"],
        restoration_needed=eval_result["restoration_needed"],
        suitability_index=eval_result["suitability_index"],
        environmental_status=eval_result["environmental_status"]
    )
