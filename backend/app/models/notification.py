"""
Notification & Alert System (FR-12) - Milestone 4.

Alerts are DERIVED, not fabricated: every alert_type below is generated
by re-using the same real-data services that already power the
Population/Habitat/Conservation pages (see notification_service.py for
the exact rule behind each one). This table exists purely to give an
alert a stable identity across page refreshes so "is_read" can persist -
`alert_key` is a deterministic fingerprint of (alert_type, site_id,
species_label) so re-running the scan updates an existing alert instead
of duplicating it.
"""
import enum
import uuid
from datetime import datetime, timezone

from sqlalchemy import Column, String, DateTime, Boolean, Enum as SAEnum, Text

from app.db.session import Base


def _uuid() -> str:
    return str(uuid.uuid4())


class AlertType(str, enum.Enum):
    ENDANGERED_SPECIES = "endangered_species"
    POPULATION_DECLINE = "population_decline"
    HABITAT_DEGRADATION = "habitat_degradation"
    MONITORING_DEVICE = "monitoring_device"
    CONSERVATION = "conservation"


class AlertSeverity(str, enum.Enum):
    CRITICAL = "critical"
    WARNING = "warning"
    INFO = "info"


class Notification(Base):
    __tablename__ = "notifications"

    id = Column(String, primary_key=True, default=_uuid)
    alert_key = Column(String, unique=True, nullable=False, index=True)

    alert_type = Column(SAEnum(AlertType), nullable=False)
    severity = Column(SAEnum(AlertSeverity), nullable=False, default=AlertSeverity.INFO)

    title = Column(String, nullable=False)
    message = Column(Text, nullable=False)

    site_id = Column(String, nullable=True)
    site_name = Column(String, nullable=True)
    species_label = Column(String, nullable=True)

    is_read = Column(Boolean, default=False)

    created_at = Column(DateTime, default=lambda: datetime.now(timezone.utc))
    updated_at = Column(DateTime, default=lambda: datetime.now(timezone.utc), onupdate=lambda: datetime.now(timezone.utc))
