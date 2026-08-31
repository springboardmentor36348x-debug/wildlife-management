"""
Reorganizes the flat inaturalist_sample/sample_images/ folder into
species-per-folder structure, using sample_metadata.csv's id -> taxon_name
mapping. Only species with at least MIN_IMAGES_PER_SPECIES images get a
folder — everything else genuinely doesn't have enough data to train on.

Copies files (does not move/delete originals) into a new folder:
    datasets/inaturalist_sample/sample_images_by_species/<species>/<id>.jpg

Run from the backend/ directory:
    python scripts/organize_inaturalist_by_species.py
"""
import csv
import os
import re
import shutil
from collections import defaultdict

BACKEND_DIR = os.path.dirname(os.path.dirname(os.path.abspath(__file__)))
DATASET_DIR = os.path.join(BACKEND_DIR, "datasets", "inaturalist_sample")
METADATA_CSV = os.path.join(DATASET_DIR, "sample_metadata.csv")
IMAGES_DIR = os.path.join(DATASET_DIR, "sample_images")
OUTPUT_DIR = os.path.join(DATASET_DIR, "sample_images_by_species")

MIN_IMAGES_PER_SPECIES = 10


def sanitize_folder_name(name: str) -> str:
    # Keep species folder names filesystem-safe
    return re.sub(r'[<>:"/\\|?*]', "", name).strip()


def main():
    if not os.path.exists(METADATA_CSV):
        raise RuntimeError(f"Metadata CSV not found: {METADATA_CSV}")

    species_to_ids = defaultdict(list)

    with open(METADATA_CSV, "r", encoding="utf-8-sig") as f:
        reader = csv.DictReader(f)
        for row in reader:
            obs_id = row.get("id", "").strip()
            taxon_name = row.get("taxon_name", "").strip()
            if not obs_id or not taxon_name:
                continue

            image_path = os.path.join(IMAGES_DIR, f"{obs_id}.jpg")
            if os.path.exists(image_path):
                species_to_ids[taxon_name].append(obs_id)

    qualifying = {
        species: ids for species, ids in species_to_ids.items()
        if len(ids) >= MIN_IMAGES_PER_SPECIES
    }

    print(f"Found {len(species_to_ids)} distinct species with matching downloaded images.")
    print(f"{len(qualifying)} species have >= {MIN_IMAGES_PER_SPECIES} images and qualify for training:\n")

    os.makedirs(OUTPUT_DIR, exist_ok=True)
    total_copied = 0

    for species, ids in sorted(qualifying.items(), key=lambda x: -len(x[1])):
        folder_name = sanitize_folder_name(species)
        species_dir = os.path.join(OUTPUT_DIR, folder_name)
        os.makedirs(species_dir, exist_ok=True)

        for obs_id in ids:
            src = os.path.join(IMAGES_DIR, f"{obs_id}.jpg")
            dst = os.path.join(species_dir, f"{obs_id}.jpg")
            if not os.path.exists(dst):
                shutil.copy2(src, dst)
                total_copied += 1

        print(f"  {species}: {len(ids)} images")

    print(f"\nCopied {total_copied} images into {OUTPUT_DIR}")
    print("Next step: re-run scripts/train_image_classifier.py to include these new species.")


if __name__ == "__main__":
    main()