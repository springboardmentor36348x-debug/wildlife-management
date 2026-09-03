"""
Reporting Schemas
"""

from pydantic import BaseModel
from typing import Optional
from datetime import datetime


class ReportGenerateRequest(BaseModel):
    report_type: str  # survey, population, biodiversity, habitat, conservation, ecosystem_health
    monitoring_site_id: Optional[int] = None
    period_start: Optional[datetime] = None
    period_end: Optional[datetime] = None
    title: Optional[str] = None
    format: str = "pdf"  # pdf, excel


class ReportResponse(BaseModel):
    id: int
    report_id: str
    report_type: str
    title: str
    summary: Optional[str] = None
    file_type: str
    file_url: str
    created_at: datetime

    class Config:
        from_attributes = True
