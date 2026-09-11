"""
DatasetFile model - tracks real uploaded files (images/audio/csv) attached
to a registered Dataset, so the dataset registry isn't just metadata but
actually holds sample/real files that can be viewed and downloaded.
"""
import uuid
from datetime import datetime, timezone

from sqlalchemy import Column, String, DateTime, ForeignKey, Integer
from sqlalchemy.orm import relationship

from app.db.session import Base


def _uuid() -> str:
    return str(uuid.uuid4())


class DatasetFile(Base):
    __tablename__ = "dataset_files"

    id = Column(String, primary_key=True, default=_uuid)
    dataset_id = Column(String, ForeignKey("datasets.id"), nullable=False)

    original_filename = Column(String, nullable=False)
    stored_filename = Column(String, nullable=False, unique=True)
    content_type = Column(String, nullable=True)
    file_size_bytes = Column(Integer, default=0)

    uploaded_by = Column(String, ForeignKey("users.id"), nullable=False)
    uploaded_at = Column(DateTime, default=lambda: datetime.now(timezone.utc))

    dataset = relationship("Dataset", back_populates="files")
