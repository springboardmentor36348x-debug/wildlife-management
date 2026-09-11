"""
Reports & Export System (FR-13) - Milestone 4.

This is the piece the project report calls out by name in section 13
("Reports & Export System") that was still missing after Milestones 1-3:
generating the five report types (Wildlife survey, Species population,
Biodiversity, Habitat assessment, Conservation) as downloadable PDF or
Excel files, instead of only showing live numbers in the UI.

Design notes:
- Every report is built from the *same* service functions the dashboard
  pages already call (population_service, habitat_service,
  conservation_service, health_score_service) - so an export always
  matches what's on screen, nothing is computed twice or differently.
- Nothing here touches Milestone 1-3 code; this module only *reads* from
  the existing services and DB models.
- Excel uses openpyxl, PDF uses reportlab - both are pure-Python and need
  no system-level binaries, so they work the same on Windows/macOS/Linux
  and inside the Docker image without extra apt packages.
"""
from __future__ import annotations

import io
from datetime import datetime, timezone

from sqlalchemy.orm import Session

from app.models.survey import Survey, MonitoringSite
from app.services import (
    population_service,
    habitat_service,
    conservation_service,
    health_score_service,
)

REPORT_TYPES = {
    "survey": "Wildlife Survey Report",
    "population": "Species Population Report",
    "biodiversity": "Biodiversity Report",
    "habitat": "Habitat Assessment Report",
    "conservation": "Conservation Report",
}


def _generated_at() -> str:
    return datetime.now(timezone.utc).strftime("%Y-%m-%d %H:%M UTC")


# ---------------------------------------------------------------------------
# Data gathering - one function per report type, each returns
# (headers: list[str], rows: list[list]) ready to hand to either writer.
# ---------------------------------------------------------------------------

def _survey_rows(db: Session) -> tuple[list[str], list[list]]:
    headers = ["Survey", "Status", "Protected Area", "Start Date", "End Date", "Monitoring Sites"]
    rows = []
    surveys = db.query(Survey).all()
    for s in surveys:
        site_count = db.query(MonitoringSite).filter(MonitoringSite.survey_id == s.id).count()
        rows.append([
            s.name,
            s.status.value if s.status else "",
            s.protected_area or "-",
            s.start_date.strftime("%Y-%m-%d") if s.start_date else "-",
            s.end_date.strftime("%Y-%m-%d") if s.end_date else "-",
            site_count,
        ])
    return headers, rows


def _population_rows(db: Session) -> tuple[list[str], list[list]]:
    headers = ["Species", "Observed Count"]
    counts = population_service.get_population_counts(db)
    rows = [[c["species"], c["count"]] for c in counts]
    return headers, rows


def _biodiversity_rows(db: Session) -> tuple[list[str], list[list]]:
    headers = ["Site", "Ecosystem Health Score", "Conservation Status", "Species Diversity Score"]
    site_names = {s.id: s.site_name for s in db.query(MonitoringSite).all()}
    scores = health_score_service.calculate_ecosystem_health_all_sites(db)
    rows = [
        [
            site_names.get(s.get("site_id"), s.get("site_id")),
            round(s.get("ecosystem_health_score", 0), 2),
            s.get("conservation_status", "-"),
            round(s.get("components", {}).get("species_diversity", {}).get("score", 0), 2)
            if s.get("components") else "-",
        ]
        for s in scores
    ]
    return headers, rows


def _habitat_rows(db: Session) -> tuple[list[str], list[list]]:
    headers = ["Site", "Habitat Type", "Classification", "Degradation Status", "Change %"]
    rows = []
    sites = db.query(MonitoringSite).all()
    for site in sites:
        classification = habitat_service.classify_habitat(site)
        degradation = habitat_service.detect_habitat_degradation(db, site.id)
        rows.append([
            site.site_name,
            site.habitat_type.value if site.habitat_type else "-",
            classification,
            degradation.get("status", "-"),
            degradation.get("change_pct") if degradation.get("change_pct") is not None else "-",
        ])
    return headers, rows


def _conservation_rows(db: Session) -> tuple[list[str], list[list]]:
    headers = ["Site", "Priority", "Reasoning"]
    priorities = conservation_service.get_conservation_priorities(db)
    rows = [
        [p.get("site_name", p.get("site_id")), p.get("priority", "-"), p.get("reasoning", "-")]
        for p in priorities
    ]
    return headers, rows


_BUILDERS = {
    "survey": _survey_rows,
    "population": _population_rows,
    "biodiversity": _biodiversity_rows,
    "habitat": _habitat_rows,
    "conservation": _conservation_rows,
}


def get_report_data(db: Session, report_type: str) -> tuple[str, list[str], list[list]]:
    if report_type not in _BUILDERS:
        raise ValueError(f"Unknown report_type '{report_type}'. Valid: {list(_BUILDERS)}")
    title = REPORT_TYPES[report_type]
    headers, rows = _BUILDERS[report_type](db)
    return title, headers, rows


# ---------------------------------------------------------------------------
# Excel writer
# ---------------------------------------------------------------------------

def build_excel_report(db: Session, report_type: str) -> io.BytesIO:
    from openpyxl import Workbook
    from openpyxl.styles import Font, PatternFill, Alignment

    title, headers, rows = get_report_data(db, report_type)

    wb = Workbook()
    ws = wb.active
    ws.title = title[:31]  # Excel sheet name hard limit

    ws.merge_cells(start_row=1, start_column=1, end_row=1, end_column=max(len(headers), 1))
    ws.cell(row=1, column=1, value=f"{title} — Wildlife Population Intelligence System")
    ws.cell(row=1, column=1).font = Font(size=14, bold=True, color="1F3D2B")
    ws.cell(row=2, column=1, value=f"Generated {_generated_at()}")
    ws.cell(row=2, column=1).font = Font(size=9, italic=True, color="666666")

    header_row = 4
    header_fill = PatternFill(start_color="1F3D2B", end_color="1F3D2B", fill_type="solid")
    for col, h in enumerate(headers, start=1):
        cell = ws.cell(row=header_row, column=col, value=h)
        cell.font = Font(bold=True, color="FFFFFF")
        cell.fill = header_fill
        cell.alignment = Alignment(horizontal="left")

    for r_idx, row in enumerate(rows, start=header_row + 1):
        for c_idx, value in enumerate(row, start=1):
            ws.cell(row=r_idx, column=c_idx, value=value)

    if not rows:
        ws.cell(row=header_row + 1, column=1, value="No data available yet for this report.")

    for col_idx, h in enumerate(headers, start=1):
        width = max(len(str(h)), *(len(str(r[col_idx - 1])) for r in rows)) if rows else len(str(h))
        ws.column_dimensions[ws.cell(row=header_row, column=col_idx).column_letter].width = min(width + 4, 50)

    buf = io.BytesIO()
    wb.save(buf)
    buf.seek(0)
    return buf


# ---------------------------------------------------------------------------
# PDF writer
# ---------------------------------------------------------------------------

def build_pdf_report(db: Session, report_type: str) -> io.BytesIO:
    from reportlab.lib import colors
    from reportlab.lib.pagesizes import A4
    from reportlab.lib.styles import getSampleStyleSheet, ParagraphStyle
    from reportlab.lib.units import mm
    from reportlab.platypus import SimpleDocTemplate, Table, TableStyle, Paragraph, Spacer

    title, headers, rows = get_report_data(db, report_type)

    buf = io.BytesIO()
    doc = SimpleDocTemplate(
        buf, pagesize=A4,
        leftMargin=18 * mm, rightMargin=18 * mm, topMargin=18 * mm, bottomMargin=18 * mm,
    )
    styles = getSampleStyleSheet()
    title_style = ParagraphStyle("WPISTitle", parent=styles["Title"], textColor=colors.HexColor("#1F3D2B"))
    subtitle_style = ParagraphStyle("WPISSubtitle", parent=styles["Normal"], textColor=colors.HexColor("#666666"))

    elements = [
        Paragraph(title, title_style),
        Paragraph("Wildlife Population Intelligence System", subtitle_style),
        Paragraph(f"Generated {_generated_at()}", subtitle_style),
        Spacer(1, 10 * mm),
    ]

    table_data = [headers] + [[str(v) for v in row] for row in rows]
    if not rows:
        table_data.append(["No data available yet for this report." + " " * 0] + [""] * (len(headers) - 1))

    table = Table(table_data, repeatRows=1, hAlign="LEFT")
    table.setStyle(TableStyle([
        ("BACKGROUND", (0, 0), (-1, 0), colors.HexColor("#1F3D2B")),
        ("TEXTCOLOR", (0, 0), (-1, 0), colors.white),
        ("FONTNAME", (0, 0), (-1, 0), "Helvetica-Bold"),
        ("FONTSIZE", (0, 0), (-1, -1), 8),
        ("GRID", (0, 0), (-1, -1), 0.5, colors.HexColor("#CCCCCC")),
        ("ROWBACKGROUNDS", (0, 1), (-1, -1), [colors.white, colors.HexColor("#F3F6F3")]),
        ("VALIGN", (0, 0), (-1, -1), "MIDDLE"),
        ("TOPPADDING", (0, 0), (-1, -1), 5),
        ("BOTTOMPADDING", (0, 0), (-1, -1), 5),
    ]))
    elements.append(table)

    doc.build(elements)
    buf.seek(0)
    return buf
