"""
Report Generation Router (PDF, Excel Exporter)
"""

import os
import uuid
from datetime import datetime, timedelta
from fastapi import APIRouter, Depends, HTTPException, status
from fastapi.responses import FileResponse
from sqlalchemy.orm import Session
from sqlalchemy import func
from typing import List, Optional

from database import get_db
from models import (
    Observation, Survey, MonitoringSite, Species, 
    GeneratedReport, User
)
from schemas.reports import ReportGenerateRequest, ReportResponse
from services.pdf_generator import pdf_generator
from services.excel_generator import excel_generator
from ai.health_scoring_engine import health_scoring_engine
from ai.recommendation_engine import recommendation_engine
from security import get_current_active_user

router = APIRouter()

REPORT_DIR = os.path.join("uploads", "reports")
os.makedirs(REPORT_DIR, exist_ok=True)


@router.get("", response_model=List[ReportResponse], include_in_schema=False)
@router.get("/", response_model=List[ReportResponse])
@router.get("/history", response_model=List[ReportResponse])
def list_reports(
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_active_user)
):
    """Retrieve history of all generated PDF & Excel reports"""
    reports = db.query(GeneratedReport).order_by(GeneratedReport.created_at.desc()).all()
    
    results = []
    for r in reports:
        results.append(ReportResponse(
            id=r.id,
            report_id=r.report_id,
            report_type=r.report_type,
            title=r.title,
            summary=r.summary,
            file_type=r.file_type,
            file_url=r.file_path,  # Expose download path
            created_at=r.created_at
        ))
    return results


@router.post("/generate", response_model=ReportResponse)
def generate_report(
    req: ReportGenerateRequest,
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_active_user)
):
    """
    Generate styled PDF or Excel report containing:
    Site telemetry, verified wildlife sightings, ecosystem health matrices, and conservation recommendations.
    """
    site_id = req.monitoring_site_id
    site = None
    if site_id:
        site = db.query(MonitoringSite).filter(MonitoringSite.id == site_id).first()
        if not site:
            raise HTTPException(status_code=404, detail="Selected monitoring site not found")
        site_name = site.site_name
        site_data = {"site_name": site.site_name, "area_km2": site.area_km2 or 100.0}
    else:
        site_name = "All Monitoring Zones (Combined Grid)"
        site_data = {"site_name": site_name, "area_km2": 500.0}

    # Fetch relevant observations
    query = db.query(
        Species.common_name.label("species_name"),
        Species.species_group.label("species_group"),
        Species.is_endangered.label("is_endangered"),
        func.count(Observation.id).label("obs_count"),
        func.sum(Observation.count).label("individual_count")
    ).join(Observation, Species.id == Observation.species_id)

    if site_id:
        query = query.join(Survey, Observation.survey_id == Survey.id)\
                     .filter(Survey.monitoring_site_id == site_id)

    observations_data = [dict(r._mapping) for r in query.group_by(Species.id).all()]

    # Ecosystem health scoring
    health_data = health_scoring_engine.calculate_health_score(
        species_diversity_score=85.0 if site_id else 88.0,
        population_stability_score=78.0 if site_id else 80.0,
        habitat_quality_score=82.0 if site_id else 84.0,
        endangered_species_score=90.0,
        environmental_conditions_score=75.0
    )

    # Explainable recommendations
    recommendations = recommendation_engine.generate_recommendations(
        site_name=site_name,
        species_name=None,
        population_trend="stable",
        habitat_quality=82.0,
        degradation_level="Low",
        is_endangered=True,
        overall_health=health_data["overall_health_score"]
    )

    # Title & Filename setup
    report_title = req.title or f"Wildlife Population & Habitat Status Report - {site_name}"
    unique_id = uuid.uuid4().hex[:10].upper()
    file_ext = "pdf" if req.format.lower() == "pdf" else "xlsx"
    filename = f"report_{unique_id}.{file_ext}"
    saved_path = os.path.join(REPORT_DIR, filename)
    file_url = f"/uploads/reports/{filename}"

    success = False
    if req.format.lower() == "pdf":
        success = pdf_generator.generate_pdf_report(
            report_title=report_title,
            site_data=site_data,
            observations_data=observations_data,
            health_data=health_data,
            recommendations=recommendations,
            output_filepath=saved_path
        )
    else:
        success = excel_generator.generate_excel_report(
            report_title=report_title,
            site_data=site_data,
            observations_data=observations_data,
            health_data=health_data,
            recommendations=recommendations,
            output_filepath=saved_path
        )

    if not success:
        raise HTTPException(status_code=500, detail="Failed to compile or style report file.")

    # Save to generated reports table
    generated_report = GeneratedReport(
        report_id=f"REP-{unique_id}",
        report_type=req.report_type,
        monitoring_site_id=site_id,
        period_start=req.period_start or (datetime.utcnow() - timedelta(days=90)),
        period_end=req.period_end or datetime.utcnow(),
        title=report_title,
        summary=f"Ecosystem Health Score: {health_data['overall_health_score']}% ({health_data['health_status']}) with {len(observations_data)} observed species.",
        file_path=file_url,
        file_type=req.format.lower(),
        created_by_id=current_user.id
    )

    db.add(generated_report)
    db.commit()
    db.refresh(generated_report)

    return ReportResponse(
        id=generated_report.id,
        report_id=generated_report.report_id,
        report_type=generated_report.report_type,
        title=generated_report.title,
        summary=generated_report.summary,
        file_type=generated_report.file_type,
        file_url=generated_report.file_path,
        created_at=generated_report.created_at
    )
