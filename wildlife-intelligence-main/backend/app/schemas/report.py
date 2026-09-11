from datetime import datetime
from typing import Any
from pydantic import BaseModel, Field
from app.models.incident import ReportType, ReportFormat


class SpeciesBreakdownItem(BaseModel):
    species: str
    count: int


class ReportSummary(BaseModel):
    images_analyzed: int
    audio_clips: int
    species_confirmed: int
    total_surveys: int
    total_monitoring_sites: int
    species_breakdown: list[SpeciesBreakdownItem] = []


class ReportRecord(BaseModel):
    record_id: str
    record_type: str  # "observation" | "dataset_file"
    timestamp: datetime
    source: str
    status: str  # "processed" | "queued"


class ReportFilterParams(BaseModel):
    survey_id: str | None = None
    site_id: str | None = None
    species: str | None = None
    start_date: datetime | None = None
    end_date: datetime | None = None
    protected_area: str | None = None


class ReportGenerateRequest(BaseModel):
    title: str | None = None
    report_type: ReportType
    format: ReportFormat = ReportFormat.PDF
    filters: ReportFilterParams | None = None


class GeneratedReportOut(BaseModel):
    id: str
    title: str
    report_type: ReportType
    file_format: ReportFormat
    file_size_bytes: int
    download_url: str
    filters_json: dict[str, Any] | None = None
    summary_metrics: dict[str, Any] | None = None
    generated_by: str
    generator_name: str | None = None
    created_at: datetime
    download_count: int

    class Config:
        from_attributes = True


class ReportTypeInfo(BaseModel):
    type: str
    name: str
    description: str
    supported_formats: list[str]
    suggested_filters: list[str]
