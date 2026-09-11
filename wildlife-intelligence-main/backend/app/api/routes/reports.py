"""
Reports & Export System API Router (Milestone 4, Feature 5).
Live report generation (PDF & Excel), file downloads, historical records, and summary feeds.
"""
import os
from fastapi import APIRouter, Depends, HTTPException, status
from fastapi.responses import FileResponse
from sqlalchemy import func
from sqlalchemy.orm import Session

from app.core.deps import get_current_user, require_roles
from app.db.session import get_db
from app.models.user import User, UserRole
from app.models.survey import Survey, MonitoringSite
from app.models.observation import Observation, ObservationType, Dataset
from app.models.dataset_file import DatasetFile
from app.models.incident import GeneratedReport, ReportFormat, ReportType
from app.schemas.report import (
    ReportSummary,
    ReportRecord,
    SpeciesBreakdownItem,
    ReportGenerateRequest,
    GeneratedReportOut,
    ReportTypeInfo,
)
from app.services import report_service

router = APIRouter(prefix="/reports", tags=["Reports & Export System"])


def _short_code(entity_id: str) -> str:
    """Turns a UUID into a short human-readable numeric suffix, e.g. '1104'."""
    return str(abs(hash(entity_id)) % 9000 + 1000)


@router.get("/types", response_model=list[ReportTypeInfo])
def get_report_types(
    current_user: User = Depends(get_current_user),
):
    """Returns available report types, descriptions, formats, and suggested filters."""
    return report_service.get_report_types_metadata()


@router.post("/generate", response_model=GeneratedReportOut, status_code=status.HTTP_201_CREATED)
def generate_report_endpoint(
    payload: ReportGenerateRequest,
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user),
):
    """
    Generates a structured report (PDF or Excel) from live database data,
    saves the file to disk, and records metadata for download tracking.
    """
    report = report_service.generate_report(
        db=db,
        report_type=payload.report_type,
        file_format=payload.format,
        generated_by_user=current_user,
        filters=payload.filters,
        title=payload.title,
    )
    return _to_report_out(report)


@router.get("/{report_id}/download")
def download_report(
    report_id: str,
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user),
):
    """Downloads a generated PDF or Excel report file."""
    report = db.query(GeneratedReport).filter(GeneratedReport.id == report_id).first()
    if not report:
        raise HTTPException(status_code=404, detail="Report not found.")

    if not os.path.exists(report.file_path):
        raise HTTPException(status_code=404, detail="Report file not found on disk.")

    report.download_count += 1
    db.commit()

    media_type = "application/pdf" if report.file_format == ReportFormat.PDF else "application/vnd.openxmlformats-officedocument.spreadsheetml.sheet"
    ext = ".pdf" if report.file_format == ReportFormat.PDF else ".xlsx"
    clean_title = "".join(c if c.isalnum() or c in (" ", "-", "_") else "_" for c in report.title).strip().replace(" ", "_")
    filename = f"{clean_title}{ext}"

    return FileResponse(
        path=report.file_path,
        media_type=media_type,
        filename=filename,
    )


@router.get("/history", response_model=list[GeneratedReportOut])
def list_report_history(
    limit: int = 50,
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user),
):
    """Returns past generated reports (filtered by user unless administrator)."""
    query = db.query(GeneratedReport)
    if current_user.role != UserRole.ADMINISTRATOR:
        query = query.filter(GeneratedReport.generated_by == current_user.id)

    reports = query.order_by(GeneratedReport.created_at.desc()).limit(limit).all()
    return [_to_report_out(r) for r in reports]


@router.get("/summary", response_model=ReportSummary)
def get_summary(
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user),
):
    """Legacy overview summary metrics."""
    image_observations = (
        db.query(Observation).filter(Observation.observation_type == ObservationType.IMAGE).count()
    )
    audio_observations = (
        db.query(Observation).filter(Observation.observation_type == ObservationType.AUDIO).count()
    )
    image_files = db.query(DatasetFile).filter(DatasetFile.content_type.like("image/%")).count()
    audio_files = db.query(DatasetFile).filter(DatasetFile.content_type.like("audio/%")).count()

    species_confirmed = (
        db.query(func.count(func.distinct(Observation.species_label)))
        .filter(Observation.species_label.isnot(None))
        .scalar()
    ) or 0

    breakdown_rows = (
        db.query(Observation.species_label, func.count(Observation.id))
        .filter(Observation.species_label.isnot(None))
        .group_by(Observation.species_label)
        .order_by(func.count(Observation.id).desc())
        .all()
    )
    species_breakdown = [
        SpeciesBreakdownItem(species=label, count=count) for label, count in breakdown_rows
    ]

    return ReportSummary(
        images_analyzed=image_observations + image_files,
        audio_clips=audio_observations + audio_files,
        species_confirmed=species_confirmed,
        total_surveys=db.query(Survey).count(),
        total_monitoring_sites=db.query(MonitoringSite).count(),
        species_breakdown=species_breakdown,
    )


@router.get("/records", response_model=list[ReportRecord])
def list_records(
    limit: int = 25,
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user),
):
    """A unified feed combining raw field observations and uploaded dataset files."""
    records: list[ReportRecord] = []

    observations = (
        db.query(Observation)
        .join(MonitoringSite, Observation.site_id == MonitoringSite.id)
        .order_by(Observation.captured_at.desc())
        .limit(limit)
        .all()
    )
    for obs in observations:
        prefix = {"image": "IMG", "audio": "SND", "telemetry": "TEL"}[obs.observation_type.value]
        records.append(
            ReportRecord(
                record_id=f"{prefix}-{_short_code(obs.id)}",
                record_type="observation",
                timestamp=obs.captured_at,
                source=obs.site.site_name if obs.site else "Unknown site",
                status="processed" if obs.species_label else "queued",
            )
        )

    dataset_files = (
        db.query(DatasetFile)
        .join(Dataset, DatasetFile.dataset_id == Dataset.id)
        .order_by(DatasetFile.uploaded_at.desc())
        .limit(limit)
        .all()
    )
    for f in dataset_files:
        content_type = f.content_type or ""
        prefix = "IMG" if content_type.startswith("image/") else "SND" if content_type.startswith("audio/") else "DOC"
        records.append(
            ReportRecord(
                record_id=f"{prefix}-{_short_code(f.id)}",
                record_type="dataset_file",
                timestamp=f.uploaded_at,
                source=f.dataset.name if f.dataset else "Unknown dataset",
                status="processed",
            )
        )

    records.sort(key=lambda r: r.timestamp, reverse=True)
    return records[:limit]


def _to_report_out(r: GeneratedReport) -> GeneratedReportOut:
    return GeneratedReportOut(
        id=r.id,
        title=r.title,
        report_type=r.report_type,
        file_format=r.file_format,
        file_size_bytes=r.file_size_bytes,
        download_url=r.download_url,
        filters_json=r.filters_json,
        summary_metrics=r.summary_metrics,
        generated_by=r.generated_by,
        generator_name=r.generator_user.full_name if r.generator_user else None,
        created_at=r.created_at,
        download_count=r.download_count,
    )
