"""
Reports & Export System (FR-13 partial) - Milestone 1 implements the live
"module records" feed and summary stats, sourced entirely from real data
(Observations + uploaded DatasetFiles), not placeholders. PDF/Excel export
is a Milestone 5 deliverable.
"""
from sqlalchemy import func
from fastapi import APIRouter, Depends, HTTPException
from fastapi.responses import StreamingResponse
from sqlalchemy.orm import Session

from app.core.deps import get_current_user
from app.db.session import get_db
from app.models.user import User
from app.models.survey import Survey, MonitoringSite
from app.models.observation import Observation, ObservationType
from app.models.dataset_file import DatasetFile
from app.models.observation import Dataset
from app.models.report_log import GeneratedReport
from app.schemas.report import (
    ReportSummary,
    ReportRecord,
    SpeciesBreakdownItem,
    ReportTypeOut,
    GenerateReportRequest,
    GeneratedReportOut,
)
from app.services import export_service

router = APIRouter(prefix="/reports", tags=["Reports"])


def _short_code(entity_id: str) -> str:
    """Turns a UUID into a short human-readable numeric suffix, e.g. '1104'."""
    return str(abs(hash(entity_id)) % 9000 + 1000)


@router.get("/summary", response_model=ReportSummary)
def get_summary(
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user),
):
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

    # Milestone 2 - Feature 3: species breakdown for the dashboard, sourced
    # live from Observation.species_label filled in by the detection pipeline.
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
    """
    A unified, timestamp-sorted feed combining raw field observations and
    uploaded dataset files - mirrors a 'recent activity' / module records
    view. Status is 'processed' once an AI pipeline has attached a species
    label (Milestone 3) or once a file upload has completed; otherwise
    'queued'.
    """
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


# ---------------------------------------------------------------------------
# Reports & Export System (FR-13) - Milestone 4.
#
# The Milestone 3 export_service.py already contained the PDF/Excel writers
# but was never wired to a route - this is that wiring, plus a small
# "Generated Reports Archive" log (GeneratedReport) so the Reports page can
# show a history of report-generation events, matching the project report's
# "Generated Wildlife Reports Archive" requirement. The archive only stores
# metadata (title/type/author/summary) - the downloadable file itself is
# always rebuilt live from the current database at download time, so a
# download can never go stale relative to what's on screen.
# ---------------------------------------------------------------------------

_MEDIA_TYPES = {
    "pdf": "application/pdf",
    "excel": "application/vnd.openxmlformats-officedocument.spreadsheetml.sheet",
}
_EXTENSIONS = {"pdf": "pdf", "excel": "xlsx"}


@router.get("/types", response_model=list[ReportTypeOut])
def list_report_types(current_user: User = Depends(get_current_user)):
    return [ReportTypeOut(key=k, label=v) for k, v in export_service.REPORT_TYPES.items()]


@router.post("/generate", response_model=GeneratedReportOut)
def generate_report(
    payload: GenerateReportRequest,
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user),
):
    """
    Logs a new entry in the reports archive. Does NOT render a file here -
    the file is generated on demand at download time via /reports/export.
    """
    if payload.report_type not in export_service.REPORT_TYPES:
        raise HTTPException(status_code=400, detail=f"Unknown report_type '{payload.report_type}'.")

    _, headers, rows = export_service.get_report_data(db, payload.report_type)
    summary = (
        f"Automated {export_service.REPORT_TYPES[payload.report_type].lower()} covering "
        f"{len(rows)} record(s) across {len(headers)} field(s)."
    )

    record = GeneratedReport(
        title=payload.title,
        report_type=payload.report_type,
        region=payload.region,
        summary=summary,
        author_id=current_user.id,
        author_name=current_user.full_name,
    )
    db.add(record)
    db.commit()
    db.refresh(record)

    return GeneratedReportOut(
        id=record.id,
        title=record.title,
        report_type=record.report_type,
        report_type_label=export_service.REPORT_TYPES[record.report_type],
        region=record.region,
        summary=record.summary,
        author_name=record.author_name,
        created_at=record.created_at,
    )


@router.get("/generated", response_model=list[GeneratedReportOut])
def list_generated_reports(
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user),
):
    records = db.query(GeneratedReport).order_by(GeneratedReport.created_at.desc()).all()
    return [
        GeneratedReportOut(
            id=r.id,
            title=r.title,
            report_type=r.report_type,
            report_type_label=export_service.REPORT_TYPES.get(r.report_type, r.report_type),
            region=r.region,
            summary=r.summary,
            author_name=r.author_name,
            created_at=r.created_at,
        )
        for r in records
    ]


@router.get("/export/{report_id}")
def export_generated_report(
    report_id: str,
    format: str = "pdf",
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user),
):
    """Downloads a previously generated report's archive entry, rebuilt live as PDF or Excel."""
    if format not in _MEDIA_TYPES:
        raise HTTPException(status_code=400, detail="format must be 'pdf' or 'excel'")

    record = db.query(GeneratedReport).filter(GeneratedReport.id == report_id).first()
    if not record:
        raise HTTPException(status_code=404, detail="Generated report not found")

    buf = (
        export_service.build_pdf_report(db, record.report_type)
        if format == "pdf"
        else export_service.build_excel_report(db, record.report_type)
    )
    filename = f"{record.title.replace(' ', '_')}.{_EXTENSIONS[format]}"
    return StreamingResponse(
        buf,
        media_type=_MEDIA_TYPES[format],
        headers={"Content-Disposition": f'attachment; filename="{filename}"'},
    )


@router.get("/export-type/{report_type}")
def export_by_type(
    report_type: str,
    format: str = "pdf",
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user),
):
    """Quick export of a report type with no archive entry (used by the report-type quick-download buttons)."""
    if format not in _MEDIA_TYPES:
        raise HTTPException(status_code=400, detail="format must be 'pdf' or 'excel'")
    if report_type not in export_service.REPORT_TYPES:
        raise HTTPException(status_code=400, detail=f"Unknown report_type '{report_type}'.")

    buf = (
        export_service.build_pdf_report(db, report_type)
        if format == "pdf"
        else export_service.build_excel_report(db, report_type)
    )
    filename = f"{report_type}_report.{_EXTENSIONS[format]}"
    return StreamingResponse(
        buf,
        media_type=_MEDIA_TYPES[format],
        headers={"Content-Disposition": f'attachment; filename="{filename}"'},
    )
