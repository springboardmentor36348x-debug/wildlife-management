import pandas as pd
import requests
import os
import random

random.seed(42)

# ---- Config ----
SPECIES_MAP = {
    "wildebeest": "wildebeest",
    "zebra": "zebra",
    "gazelleThomsons": "gazelle_thomsons",
    "gazellethomsons": "gazelle_thomsons",
    "buffalo": "buffalo",
    "elephant": "elephant",
    "hartebeest": "hartebeest",
    "impala": "impala",
    "giraffe": "giraffe",
}
IMAGES_PER_SPECIES = 200
BASE_URL = "https://snapshotserengeti.s3.msi.umn.edu/"
OUTPUT_DIR = "training_data"

# ---- Step 1: Load annotations (species per capture) ----
print("Loading annotations...")
ann = pd.read_csv(
    "SnapshotSerengeti_v2_1_annotations.csv",
    usecols=["capture_id", "question__species"],
    low_memory=False,
)
ann["species_clean"] = ann["question__species"].map(SPECIES_MAP)
ann = ann.dropna(subset=["species_clean"])
print(f"Found {len(ann)} annotation rows for our target species")

# ---- Step 2: Load images (file path per capture), keep first image per capture ----
print("Loading images list (this file is large, may take a minute)...")
imgs = pd.read_csv(
    "SnapshotSerengeti_v2_1_images.csv",
    usecols=["capture_id", "image_rank_in_capture", "image_path_rel"],
)
imgs = imgs[imgs["image_rank_in_capture"] == 1]  # one image per capture event

# ---- Step 3: Join species labels with actual file paths ----
merged = ann.merge(imgs, on="capture_id", how="inner")
print(f"Matched {len(merged)} images with species labels")

# ---- Step 4: Sample N images per species, split train/val ----
os.makedirs(OUTPUT_DIR, exist_ok=True)

for species in sorted(set(SPECIES_MAP.values())):
    subset = merged[merged["species_clean"] == species]
    sample_size = min(IMAGES_PER_SPECIES, len(subset))
    sample = subset.sample(n=sample_size, random_state=42)

    split_point = int(sample_size * 0.85)
    train_rows = sample.iloc[:split_point]
    val_rows = sample.iloc[split_point:]

    for split_name, rows in [("train", train_rows), ("val", val_rows)]:
        folder = os.path.join(OUTPUT_DIR, split_name, species)
        os.makedirs(folder, exist_ok=True)

        downloaded = 0
        for _, row in rows.iterrows():
            url = BASE_URL + row["image_path_rel"]
            filename = row["image_path_rel"].replace("/", "_")
            filepath = os.path.join(folder, filename)

            if os.path.exists(filepath):
                downloaded += 1
                continue

            try:
                resp = requests.get(url, timeout=10)
                if resp.status_code == 200:
                    with open(filepath, "wb") as f:
                        f.write(resp.content)
                    downloaded += 1
            except requests.RequestException:
                pass

        print(f"{species} [{split_name}]: {downloaded}/{len(rows)} downloaded")

print("Done! Dataset ready in ./training_data/")