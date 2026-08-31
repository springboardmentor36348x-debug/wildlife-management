import uuid
from sqlalchemy import Column, String, Date, ForeignKey
from app.database import Base


class Survey(Base):
    __tablename__ = "surveys"

    id = Column(String, primary_key=True, default=lambda: str(uuid.uuid4()))
    survey_code = Column(String(50), unique=True, nullable=False)
    title = Column(String(200), nullable=False)
    habitat_type = Column(String(100), nullable=False)
    protected_area = Column(String(150), nullable=True)
    survey_date = Column(Date, nullable=False)
    created_by = Column(String, ForeignKey("users.id"))