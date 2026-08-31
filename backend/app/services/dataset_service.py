import os
from sqlalchemy.orm import Session
from app.models.image_dataset import ImageDatasetEntry

VALID_EXTENSIONS = (".jpg", ".jpeg", ".png")


def scan_image_dataset(base_path: str, source_dataset: str, db: Session):
    """
    Walks a folder structured as:
        base_path/<SPECIES_NAME>/image1.jpg, image2.jpg, ...
    and indexes every image into the image_dataset_entries table.
    Returns a summary dict.
    """
    if not os.path.isdir(base_path):
        raise FileNotFoundError(f"Dataset path not found: {base_path}")

    summary = {}
    entries_to_insert = []

    for species_folder in sorted(os.listdir(base_path)):
        species_path = os.path.join(base_path, species_folder)
        if not os.path.isdir(species_path):
            continue

        images = [
            f for f in os.listdir(species_path)
            if f.lower().endswith(VALID_EXTENSIONS)
        ]
        summary[species_folder] = len(images)

        for img in images:
            rel_path = os.path.join(species_folder, img)
            entries_to_insert.append(
                ImageDatasetEntry(
                    species_label=species_folder,
                    file_path=rel_path,
                    source_dataset=source_dataset,
                    image_count_in_species=len(images)
                )
            )

    # wipe old entries for this source before re-indexing (avoids duplicates on re-run)
    db.query(ImageDatasetEntry).filter(
        ImageDatasetEntry.source_dataset == source_dataset
    ).delete()

    db.bulk_save_objects(entries_to_insert)
    db.commit()

    return {
        "source_dataset": source_dataset,
        "species_count": len(summary),
        "total_images": sum(summary.values()),
        "per_species": summary
    }