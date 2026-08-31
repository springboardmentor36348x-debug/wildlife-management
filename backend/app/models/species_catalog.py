import uuid
from sqlalchemy import Column, String
from app.database import Base


class SpeciesCatalog(Base):
    __tablename__ = "species_catalog"

    id = Column(String, primary_key=True, default=lambda: str(uuid.uuid4()))
    scientific_name = Column(String(200), nullable=False)
    common_name = Column(String(200), nullable=True)
    taxonomic_group = Column(String(100), nullable=True)
    conservation_status = Column(String(50), nullable=True)
    source_dataset = Column(String(100), nullable=False)