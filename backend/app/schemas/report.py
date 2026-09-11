from datetime import datetime
from pydantic import BaseModel


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


# --- Reports & Export System (FR-13) - Milestone 4 -------------------------

class ReportTypeOut(BaseModel):
    key: str
    label: str


class GenerateReportRequest(BaseModel):
    title: str
    report_type: str
    region: str | None = None


class GeneratedReportOut(BaseModel):
    id: str
    title: str
    report_type: str
    report_type_label: str
    region: str | None = None
    summary: str | None = None
    author_name: str | None = None
    created_at: datetime

    class Config:
        from_attributes = True
