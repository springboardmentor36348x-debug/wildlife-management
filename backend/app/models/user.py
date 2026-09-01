"""
User model implementing FR-1: Authentication & Role-Based Access Control.

Four roles are supported per the spec:
  - administrator
  - researcher
  - conservation_officer
  - forest_department
"""
import enum
import uuid
from datetime import datetime, timezone

from sqlalchemy import Column, String, DateTime, Boolean, Enum as SAEnum
from sqlalchemy.orm import relationship

from app.db.session import Base


class UserRole(str, enum.Enum):
    ADMINISTRATOR = "administrator"
    RESEARCHER = "researcher"
    CONSERVATION_OFFICER = "conservation_officer"
    FOREST_DEPARTMENT = "forest_department"


def _uuid() -> str:
    return str(uuid.uuid4())


class User(Base):
    __tablename__ = "users"

    id = Column(String, primary_key=True, default=_uuid)
    full_name = Column(String, nullable=False)
    email = Column(String, unique=True, index=True, nullable=False)
    hashed_password = Column(String, nullable=False)
    role = Column(SAEnum(UserRole), nullable=False, default=UserRole.RESEARCHER)
    organization = Column(String, nullable=True)
    is_active = Column(Boolean, default=True)
    created_at = Column(DateTime, default=lambda: datetime.now(timezone.utc))

    surveys = relationship("Survey", back_populates="created_by_user")
