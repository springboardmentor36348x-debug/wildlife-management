from pydantic import BaseModel


class SpeciesResponse(BaseModel):
    id: str
    scientific_name: str
    common_name: str | None
    taxonomic_group: str | None
    conservation_status: str | None
    source_dataset: str

    class Config:
        from_attributes = True