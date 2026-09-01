from fastapi import APIRouter, Depends, Query
from sqlalchemy.orm import Session

from app.database.connection import get_db
from app.services.population_service import (
    get_population_summary,
    search_population_species
)


router = APIRouter(
    prefix="/population",
    tags=["Population Intelligence"]
)


@router.get("/summary")
def population_summary(
    db: Session = Depends(get_db)
):
    return get_population_summary(db)


@router.get("/species-search")
def species_search(
    query: str = Query(..., min_length=1),
    db: Session = Depends(get_db)
):
    return search_population_species(db, query)


@router.get("/locations")
def population_locations():

    import pandas as pd
    from pathlib import Path

    project_folder = Path(__file__).resolve().parents[3]

    dataset_path = (
        project_folder
        / "datasets"
        / "wildlife_population_data.csv"
    )

    df = pd.read_csv(dataset_path)

    df = df[
        [
            "scientific_name",
            "common_name",
            "iconic_taxon_name",
            "latitude",
            "longitude",
            "observed_on"
        ]
    ].copy()

    df = df.dropna(
        subset=[
            "scientific_name",
            "latitude",
            "longitude"
        ]
    )

    df = df.astype(object).where(
        pd.notna(df),
        None
    )

    df = df.head(3000)

    return df.to_dict(orient="records")