"""
Step 2 of the training pipeline: convert the Snapshot Serengeti bounding-box
annotations (COCO Camera Traps .json format) into the format YOLOv8 expects:

    dataset/yolo/
        images/train/*.jpg
        images/val/*.jpg
        labels/train/*.txt   <- one .txt per image, same filename stem
        labels/val/*.txt
        data.yaml            <- class list + paths, fed to `yolo train`

Each YOLO label line is: <class_id> <x_center> <y_center> <width> <height>
with all four coordinates normalized to 0-1 (COCO camera traps gives
absolute pixel bbox as [x, y, width, height] from the top-left corner).

Split strategy: LILA recommends splitting by camera *location* rather than
randomly by image, since images from the same location are highly similar
(same background, lighting) - a random split would leak near-duplicate scenes
into both train and val and make validation accuracy look artificially good.
This script does a location-based 85/15 split unless you pass
--use-lila-split with LILA's official split file.

Usage:
    python convert_to_yolo.py --raw-dir dataset/raw --output-dir dataset/yolo
"""
import argparse
import json
import random
import shutil
from collections import defaultdict
from pathlib import Path

from PIL import Image
from tqdm import tqdm


def load_lila_split(split_path: Path):
    """Optional: load LILA's official train/val location split if provided."""
    with open(split_path) as f:
        split = json.load(f)
    # Expected shape: {"train": [location_ids...], "val": [location_ids...]}
    return set(split.get("train", [])), set(split.get("val", []))


def main():
    parser = argparse.ArgumentParser(description="Convert Snapshot Serengeti bboxes to YOLO format.")
    parser.add_argument("--raw-dir", default="dataset/raw", help="Directory from download_dataset.py")
    parser.add_argument("--output-dir", default="dataset/yolo", help="Where to write the YOLO-formatted dataset")
    parser.add_argument("--val-fraction", type=float, default=0.15, help="Fraction of locations held out for validation")
    parser.add_argument("--use-lila-split", default=None, help="Optional path to LILA's official split JSON")
    parser.add_argument("--seed", type=int, default=42)
    args = parser.parse_args()

    raw_dir = Path(args.raw_dir)
    out_dir = Path(args.output_dir)
    bbox_json_path = raw_dir / "bboxes.json"

    with open(bbox_json_path) as f:
        data = json.load(f)

    categories = {c["id"]: c["name"] for c in data["categories"]}
    # YOLO needs contiguous 0-indexed class ids; COCO camera traps ids may not be contiguous.
    sorted_cat_ids = sorted(categories.keys())
    cat_id_to_yolo_idx = {cat_id: i for i, cat_id in enumerate(sorted_cat_ids)}
    class_names = [categories[cid] for cid in sorted_cat_ids]

    images_by_id = {img["id"]: img for img in data["images"]}

    annotations_by_image = defaultdict(list)
    for ann in data["annotations"]:
        if "bbox" not in ann:
            continue  # skip species-only tags with no box
        annotations_by_image[ann["image_id"]].append(ann)

    # ---- Determine train/val split ----
    if args.use_lila_split:
        train_locations, val_locations = load_lila_split(Path(args.use_lila_split))

        def split_of(img):
            loc = img.get("location")
            return "val" if loc in val_locations else "train"
    else:
        random.seed(args.seed)
        all_locations = sorted({img.get("location", "unknown") for img in images_by_id.values()})
        random.shuffle(all_locations)
        n_val = max(1, int(len(all_locations) * args.val_fraction))
        val_locations = set(all_locations[:n_val])

        def split_of(img):
            return "val" if img.get("location", "unknown") in val_locations else "train"

    # ---- Write YOLO files ----
    counts = {"train": 0, "val": 0, "skipped_no_box": 0, "skipped_missing_image": 0}

    for image_id, anns in tqdm(annotations_by_image.items(), desc="Converting"):
        img_meta = images_by_id.get(image_id)
        if img_meta is None:
            continue

        src_image_path = raw_dir / "images" / img_meta["file_name"]
        if not src_image_path.exists():
            counts["skipped_missing_image"] += 1
            continue

        split = split_of(img_meta)
        stem = Path(img_meta["file_name"]).stem.replace("/", "_")

        dest_image_dir = out_dir / "images" / split
        dest_label_dir = out_dir / "labels" / split
        dest_image_dir.mkdir(parents=True, exist_ok=True)
        dest_label_dir.mkdir(parents=True, exist_ok=True)

        # Get real pixel dimensions (COCO camera traps doesn't always include width/height)
        if "width" in img_meta and "height" in img_meta:
            img_w, img_h = img_meta["width"], img_meta["height"]
        else:
            with Image.open(src_image_path) as im:
                img_w, img_h = im.size

        yolo_lines = []
        for ann in anns:
            x, y, w, h = ann["bbox"]  # absolute pixels, top-left origin
            x_center = (x + w / 2) / img_w
            y_center = (y + h / 2) / img_h
            norm_w = w / img_w
            norm_h = h / img_h
            yolo_idx = cat_id_to_yolo_idx[ann["category_id"]]
            yolo_lines.append(f"{yolo_idx} {x_center:.6f} {y_center:.6f} {norm_w:.6f} {norm_h:.6f}")

        if not yolo_lines:
            counts["skipped_no_box"] += 1
            continue

        shutil.copy2(src_image_path, dest_image_dir / f"{stem}.jpg")
        (dest_label_dir / f"{stem}.txt").write_text("\n".join(yolo_lines))
        counts[split] += 1

    # ---- Write data.yaml ----
    data_yaml = out_dir / "data.yaml"
    data_yaml.write_text(
        "path: " + str(out_dir.resolve()) + "\n"
        "train: images/train\n"
        "val: images/val\n"
        f"nc: {len(class_names)}\n"
        "names: " + json.dumps(class_names) + "\n"
    )

    print("\nConversion complete.")
    print(f"  Train images: {counts['train']}")
    print(f"  Val images:   {counts['val']}")
    print(f"  Skipped (no box): {counts['skipped_no_box']}")
    print(f"  Skipped (image file missing locally): {counts['skipped_missing_image']}")
    print(f"  Classes ({len(class_names)}): {class_names}")
    print(f"\nWrote dataset config: {data_yaml}")
    print("Next step: python train.py")


if __name__ == "__main__":
    main()
