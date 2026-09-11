"""
Reports & Export System (FR-13) - Milestone 4.

This table only persists a generated report's METADATA (title, type,
author, a short summary). The actual PDF/Excel/CSV bytes are always
rebuilt live from the current database at download time via
export_service - the same pattern export_service.py's own docstring
describes ("an export always matches what's on screen"). We deliberately
never store the rendered file on disk: storing generated PDFs/Excel
files would let the download drift out of date from the live data.
"""
import uuid
from datetime import datetime, timezone

from sqlalchemy import Column, String, DateTime, Text

from app.db.session import Base


def _uuid() -> str:
    return str(uuid.uuid4())


class GeneratedReport(Base):
    __tablename__ = "generated_reports"

    id = Column(String, primary_key=True, default=_uuid)
    title = Column(String, nullable=False)
    report_type = Column(String, nullable=False)  # matches export_service.REPORT_TYPES keys
    region = Column(String, nullable=True)  # free-text "Monitoring Region" label the user typed
    summary = Column(Text, nullable=True)

    author_id = Column(String, nullable=True)
    author_name = Column(String, nullable=True)

    created_at = Column(DateTime, default=lambda: datetime.now(timezone.utc))
