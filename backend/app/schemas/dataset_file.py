from datetime import datetime
from pydantic import BaseModel


class DatasetFileOut(BaseModel):
    id: str
    dataset_id: str
    original_filename: str
    content_type: str | None
    file_size_bytes: int
    uploaded_by: str
    uploaded_at: datetime
    url: str  # relative URL the frontend can use to view/download the file

    class Config:
        from_attributes = True
