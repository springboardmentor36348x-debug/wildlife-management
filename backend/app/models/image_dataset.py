import uuid
from sqlalchemy import Column, String, Integer
from app.database import Base


class ImageDatasetEntry(Base):
    __tablename__ = "image_dataset_entries"

    id = Column(String, primary_key=True, default=lambda: str(uuid.uuid4()))
    species_label = Column(String(200), nullable=False)   # folder name = species
    file_path = Column(String(500), nullable=False)        # relative path to image
    source_dataset = Column(String(100), nullable=False)   # e.g. "Bird Speciees Dataset"
    image_count_in_species = Column(Integer, nullable=True)