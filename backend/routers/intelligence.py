from fastapi import APIRouter, Depends, Query
from sqlalchemy.orm import Session
from typing import Optional

from database import get_db
import schemas_intelligence as si
import services.population_service as population_service
import services.habitat_service as habitat_service
import services.conservation_service as conservation_service
import services.analytics_service as analytics_service

router = APIRouter(prefix="/api/v1/intelligence", tags=["Intelligence & Conservation"])


# -------------------------------------------------------------
# 1. Population Estimation Endpoints
# -------------------------------------------------------------
@router.get("/population/overview", response_model=si.PopulationOverviewResponse)
def get_population_overview(
    species: Optional[str] = Query(None, description="Filter by species name"),
    site_id: Optional[int] = Query(None, description="Filter by monitoring site ID"),
    months: int = Query(12, ge=1, le=36, description="Number of months of trend data"),
    db: Session = Depends(get_db)
):
    """
    Get comprehensive population intelligence: total estimated population,
    growth rates, species density, regional distribution, and time-series trends.
    """
    return population_service.calculate_population_overview(
        db=db,
        species_filter=species,
        site_id_filter=site_id,
        months_span=months
    )


# -------------------------------------------------------------
# 2. Habitat Intelligence Endpoints
# -------------------------------------------------------------
@router.get("/habitat/overview", response_model=si.HabitatIntelligenceResponse)
def get_habitat_intelligence(db: Session = Depends(get_db)):
    """
    Get habitat quality metrics, degradation risk indices, and alerts
    across all monitored ecosystems and sites.
    """
    return habitat_service.assess_habitat_intelligence(db=db)


# -------------------------------------------------------------
# 3. Conservation Recommendation Endpoints
# -------------------------------------------------------------
@router.get("/conservation/recommendations", response_model=si.ConservationOverviewResponse)
def get_conservation_recommendations(db: Session = Depends(get_db)):
    """
    Get algorithmic, prioritized conservation interventions and recommended actions
    based on species IUCN status, population decline trends, and habitat stress.
    """
    return conservation_service.generate_conservation_recommendations(db=db)


# -------------------------------------------------------------
# 4. Ecosystem Health & Biodiversity Analytics Endpoints
# -------------------------------------------------------------
@router.get("/analytics/biodiversity", response_model=si.BiodiversityMetrics)
def get_biodiversity_metrics(
    site_id: Optional[int] = Query(None, description="Optional site filter"),
    db: Session = Depends(get_db)
):
    """
    Get Shannon-Wiener diversity index, Simpson's index, species richness,
    and overall ecosystem health scores.
    """
    return analytics_service.compute_biodiversity_analytics(db=db, site_id=site_id)


# -------------------------------------------------------------
# 5. Wildlife Monitoring Reports & Export Endpoints
# -------------------------------------------------------------
import services.report_service as report_service
from fastapi.responses import Response, StreamingResponse


@router.get("/reports/summary")
def get_reports_summary(db: Session = Depends(get_db)):
    """
    Get monthly observation summary metrics and recent generated reports.
    """
    return report_service.get_reports_summary(db=db)


@router.get("/reports/export/csv")
def export_csv_report(db: Session = Depends(get_db)):
    """
    Download consolidated wildlife monitoring & population spreadsheet (.csv).
    """
    csv_file = report_service.generate_csv_report(db=db)
    response = Response(
        content=csv_file.getvalue(),
        media_type="text/csv",
        headers={"Content-Disposition": "attachment; filename=wildlife_monitoring_report.csv"}
    )
    return response


@router.get("/reports/export/pdf")
def export_pdf_report(db: Session = Depends(get_db)):
    """
    Download official formatted wildlife intelligence & population PDF report.
    """
    pdf_buffer = report_service.generate_pdf_report(db=db)
    response = Response(
        content=pdf_buffer.getvalue(),
        media_type="application/pdf",
        headers={"Content-Disposition": "attachment; filename=wildlife_monitoring_report.pdf"}
    )
    return response
