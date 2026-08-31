import csv
import os
import sys

BACKEND_DIR = os.path.dirname(os.path.dirname(os.path.abspath(__file__)))
sys.path.insert(0, BACKEND_DIR)

from app.database import SessionLocal, Base, engine
from app.models.species_catalog import SpeciesCatalog
from app.models import user, survey, monitoring_site, camera_trap
from app.models import audio_sensor, observation, image_dataset
from app.models import species_prediction, audio_prediction

DATASETS_DIR = os.path.join(BACKEND_DIR, "datasets")
CATALOG_FILENAMES = {"normalized.csv", "sample_metadata.csv", "species_sample.csv"}
REQUIRED_COLUMNS = {"scientific_name"}


def find_catalog_csvs():
    for root, _dirs, files in os.walk(DATASETS_DIR):
        for fname in files:
            if fname.lower() in CATALOG_FILENAMES:
                source_dataset = os.path.basename(root) or "root"
                yield source_dataset, os.path.join(root, fname)

    project_root_csv = os.path.join(os.path.dirname(BACKEND_DIR), "species_sample.csv")
    if os.path.exists(project_root_csv):
        yield "species_sample_root", project_root_csv


def import_csv(db, source_dataset: str, csv_path: str):
    with open(csv_path, "r", encoding="utf-8-sig") as f:
        reader = csv.DictReader(f)
        if reader.fieldnames is None or not REQUIRED_COLUMNS.issubset(
            {c.strip() for c in reader.fieldnames}
        ):
            print(f"  ! Skipping {csv_path} — missing required column 'scientific_name'")
            return 0

        rows = []
        for row in reader:
            scientific_name = (row.get("scientific_name") or "").strip()
            if not scientific_name:
                continue
            rows.append(SpeciesCatalog(
                scientific_name=scientific_name,
                common_name=(row.get("common_name") or "").strip() or None,
                taxonomic_group=(row.get("taxonomic_group") or "").strip() or None,
                conservation_status=(row.get("conservation_status") or "").strip() or None,
                source_dataset=source_dataset,
            ))

    if not rows:
        return 0

    db.query(SpeciesCatalog).filter(SpeciesCatalog.source_dataset == source_dataset).delete()
    db.bulk_save_objects(rows)
    db.commit()
    return len(rows)


def main():
    Base.metadata.create_all(bind=engine)
    db = SessionLocal()
    total = 0
    try:
        for source_dataset, csv_path in find_catalog_csvs():
            count = import_csv(db, source_dataset, csv_path)
            print(f"  [{source_dataset}] {os.path.basename(csv_path)} -> {count} species rows")
            total += count
    finally:
        db.close()
    print(f"\nDone. Imported {total} species_catalog rows total.")


if __name__ == "__main__":
    main()