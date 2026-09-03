import enum
import uuid
from datetime import datetime

from sqlalchemy import Column, String, DateTime, Enum, Boolean
from app.db_types import GUID

from app.database import Base


class UserRole(str, enum.Enum):
    WILDLIFE_RESEARCHER = "wildlife_researcher"
    CONSERVATION_OFFICER = "conservation_officer"
    FOREST_DEPARTMENT_OFFICER = "forest_department_officer"
    ADMINISTRATOR = "administrator"


class User(Base):
    __tablename__ = "users"

    id = Column(GUID(), primary_key=True, default=uuid.uuid4)
    full_name = Column(String(150), nullable=False)
    email = Column(String(150), unique=True, index=True, nullable=False)
    hashed_password = Column(String(255), nullable=False)
    organization = Column(String(150), nullable=True)
    role = Column(Enum(UserRole), nullable=False, default=UserRole.WILDLIFE_RESEARCHER)
    is_active = Column(Boolean, default=True)
    created_at = Column(DateTime, default=datetime.utcnow)
    updated_at = Column(DateTime, default=datetime.utcnow, onupdate=datetime.utcnow)
