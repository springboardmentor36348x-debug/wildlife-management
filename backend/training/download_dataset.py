"""
Step 1 of the training pipeline: download the Snapshot Serengeti
bounding-box-annotated subset (the only part of the dataset usable for
training an object detector like YOLOv8).

Why not the full 7.1M-image dataset?
LILA's Snapshot Serengeti release is ~2.65M sequences / 7.1M images across
11 seasons, each season alone being 242GB-636GB. The vast majority of those
images only have a whole-image species *tag* (e.g. "wildebeest"), not a
bounding box - so they can't directly train a detector. LILA separately
publishes ~150,000 bounding boxes across ~78,000 images specifically for
detection training. That subset is what this script downloads.

Before running this script:
1. Go to https://lila.science/datasets/snapshot-serengeti
2. Under "Bounding boxes", copy the direct link to the bounding-box JSON
   file and paste it into BBOX_JSON_URL below (LILA occasionally renames
   these files, so grabbing the current link avoids a stale hardcoded URL).
3. Same for "Recommended train/val splits" if you want to reuse LILA's
   official location-based split (recommended, avoids leaking the same
   camera location into both train and val).

Usage:
    python download_dataset.py --bbox-json-url <URL> --output-dir dataset/raw

This downloads:
    dataset/raw/bboxes.json          - the COCO Camera Traps bbox annotations
    dataset/raw/images/<file_name>   - only the images referenced in bboxes.json
                                        (NOT the full 7TB dataset)
"""
import argparse
import json
import os
import sys
from pathlib import Path

import requests
from tqdm import tqdm

# Base path for Snapshot Serengeti images on Azure blob storage (public, no auth needed).
# Confirm this still matches the "Downloading the data" section on the LILA page above
# before a large run - LILA occasionally migrates storage backends.
AZURE_IMAGE_BASE = "https://lilawildlife.blob.core.windows.net/lila-wildlife/snapshotserengeti-unzipped"


def download_file(url: str, dest: Path, chunk_size: int = 1 << 16) -> None:
    dest.parent.mkdir(parents=True, exist_ok=True)
    if dest.exists() and dest.stat().st_size > 0:
        return  # resume-friendly: skip files already downloaded
    with requests.get(url, stream=True, timeout=60) as r:
        r.raise_for_status()
        with open(dest, "wb") as f:
            for chunk in r.iter_content(chunk_size=chunk_size):
                if chunk:
                    f.write(chunk)


def main():
    parser = argparse.ArgumentParser(description="Download the Snapshot Serengeti bbox training subset.")
    parser.add_argument("--bbox-json-url", required=True, help="Direct URL to the bounding-box .json file from LILA")
    parser.add_argument("--output-dir", default="dataset/raw", help="Where to save the JSON + images")
    parser.add_argument("--limit", type=int, default=None, help="Optional: only download first N images (for a quick test run)")
    args = parser.parse_args()

    output_dir = Path(args.output_dir)
    output_dir.mkdir(parents=True, exist_ok=True)
    bbox_json_path = output_dir / "bboxes.json"

    print(f"Downloading bounding-box annotations from {args.bbox_json_url} ...")
    download_file(args.bbox_json_url, bbox_json_path)

    print("Parsing annotation file ...")
    with open(bbox_json_path) as f:
        data = json.load(f)

    images = data["images"]
    if args.limit:
        # Keep only images that actually have an annotation, then trim to --limit,
        # so a quick test run still has usable label data.
        annotated_ids = {ann["image_id"] for ann in data["annotations"]}
        images = [img for img in images if img["id"] in annotated_ids][: args.limit]
        print(f"--limit set: downloading only {len(images)} annotated images for a quick test run.")

    images_dir = output_dir / "images"
    print(f"Downloading {len(images)} images to {images_dir} ...")

    failed = []
    for img in tqdm(images):
        file_name = img["file_name"]
        url = f"{AZURE_IMAGE_BASE}/{file_name}"
        dest = images_dir / file_name
        try:
            download_file(url, dest)
        except Exception as e:
            failed.append((file_name, str(e)))

    if failed:
        print(f"\n{len(failed)} images failed to download (see dataset/raw/failed_downloads.txt)")
        with open(output_dir / "failed_downloads.txt", "w") as f:
            for name, err in failed:
                f.write(f"{name}\t{err}\n")

    print(f"\nDone. Annotations: {bbox_json_path}")
    print(f"Images saved under: {images_dir}")
    print("Next step: python convert_to_yolo.py")


if __name__ == "__main__":
    main()
