import os
import sys

BACKEND_DIR = os.path.dirname(os.path.dirname(os.path.abspath(__file__)))
sys.path.insert(0, BACKEND_DIR)

from app.database import SessionLocal, Base, engine
from app.models import user, survey, monitoring_site, camera_trap
from app.models import audio_sensor, observation, species_catalog
from app.models import image_dataset, species_prediction, audio_prediction
from app.services.dataset_service import scan_image_dataset

DATASETS_DIR = os.path.join(BACKEND_DIR, "datasets")

IMAGE_DATASET_FOLDERS = [
    ("Bird Speciees Dataset", "Bird Speciees Dataset"),
    ("animal_kingdom_substitute", "animal_kingdom_substitute"),
    (os.path.join("inaturalist_sample", "sample_images"), "inaturalist_sample"),
    ("snapshot_serengeti_sample", "snapshot_serengeti_sample"),
]


def main():
    Base.metadata.create_all(bind=engine)
    db = SessionLocal()
    try:
        for rel_path, source_dataset in IMAGE_DATASET_FOLDERS:
            base_path = os.path.join(DATASETS_DIR, rel_path)
            if not os.path.isdir(base_path):
                print(f"  - {rel_path}: folder not found, skipping")
                continue
            try:
                summary = scan_image_dataset(base_path, source_dataset, db)
            except FileNotFoundError as e:
                print(f"  ! {rel_path}: {e}")
                continue

            if summary["species_count"] == 0:
                print(f"  - {rel_path}: found no species subfolders (likely flat — check manually)")
            else:
                print(f"  ✓ {rel_path}: {summary['species_count']} species, "
                      f"{summary['total_images']} images indexed as '{source_dataset}'")
    finally:
        db.close()
    print("\nDone.")


if __name__ == "__main__":
    main()