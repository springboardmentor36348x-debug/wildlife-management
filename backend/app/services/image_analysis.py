"""
Wildlife Image Analysis Engine (Milestone 2, spec section 4.3 / 4.5).

ARCHITECTURE NOTE (updated): species identification uses a tiered strategy,
best available option first:

  1. SpeciesNet (Google) + MegaDetector (Microsoft) - a pretrained,
     production-grade global pipeline covering 2000+ species worldwide,
     already used by the Wildlife Insights platform (Google/WWF/Smithsonian/
     Wildlife Conservation Society). Zero training required. This is what
     "identify wildlife species globally" actually means in practice - no
     single bounding-box dataset (e.g. Snapshot Serengeti) covers global
     species diversity, so fine-tuning on one region isn't the right tool
     for that goal. See backend/training/README.md for more on this.
  2. A custom-finetuned YOLOv8 checkpoint, if YOLO_MODEL_PATH is set to one
     (e.g. produced by backend/training/train.py for a hyper-local species
     set not covered by SpeciesNet's 2000 classes).
  3. Stock YOLOv8 COCO checkpoint, filtered to animal classes (better than
     nothing, but only ~10 generic animal categories).
  4. A mock detector, so the rest of the platform (auth, surveys, dashboards)
     stays demoable even with none of the above installed.

Each tier is optional at import time - the engine degrades gracefully to
the next tier down rather than crashing, since these are heavy, separately
installed dependencies (see requirements.txt).
"""
from __future__ import annotations

import json
import random
import shutil
import subprocess
import tempfile
import time
from dataclasses import dataclass, field
from pathlib import Path
from typing import List, Optional

import numpy as np

try:
    import cv2
except ImportError:  # pragma: no cover
    cv2 = None

try:
    from ultralytics import YOLO
    _YOLO_AVAILABLE = True
except ImportError:  # pragma: no cover
    _YOLO_AVAILABLE = False

try:
    import importlib.util
    _SPECIESNET_AVAILABLE = (
        importlib.util.find_spec("speciesnet") is not None
        and importlib.util.find_spec("megadetector") is not None
    )
except ImportError:  # pragma: no cover
    _SPECIESNET_AVAILABLE = False


# COCO classes that loosely map to wildlife-relevant animals in the stock
# YOLOv8 checkpoint. Only used as a last-resort tier - see module docstring.
_COCO_ANIMAL_CLASSES = {
    "bird", "cat", "dog", "horse", "sheep", "cow", "elephant",
    "bear", "zebra", "giraffe",
}

_MOCK_SPECIES_POOL = [
    ("Bengal Tiger", "Panthera tigris tigris", "mammal", "endangered"),
    ("Indian Elephant", "Elephas maximus indicus", "mammal", "endangered"),
    ("Spotted Deer", "Axis axis", "mammal", "least_concern"),
    ("Indian Peafowl", "Pavo cristatus", "bird", "least_concern"),
    ("Sloth Bear", "Melursus ursinus", "mammal", "vulnerable"),
    ("Indian Rock Python", "Python molurus", "reptile", "near_threatened"),
]

_model_cache = {"yolo_model": None}


@dataclass
class Detection:
    species_common_name: str
    species_scientific_name: str
    species_group: str
    conservation_status: str
    confidence_score: float
    individual_count: int
    bounding_box: List[float] = field(default_factory=list)  # [x1, y1, x2, y2] normalized
    behavior: str = "unknown"


def assess_image_quality(image: "np.ndarray") -> float:
    """
    Simple heuristic quality score (0-1) based on Laplacian variance (blur)
    and brightness. Real implementation can extend with noise/occlusion checks.
    """
    if cv2 is None or image is None:
        return 0.75  # neutral default when OpenCV isn't available

    gray = cv2.cvtColor(image, cv2.COLOR_BGR2GRAY)
    blur_score = cv2.Laplacian(gray, cv2.CV_64F).var()
    brightness = gray.mean()

    blur_component = min(blur_score / 500.0, 1.0)          # sharper = higher
    brightness_component = 1.0 - abs(brightness - 128) / 128.0  # closer to mid-gray = better

    quality = round(0.6 * blur_component + 0.4 * brightness_component, 3)
    return max(0.0, min(quality, 1.0))


def _mock_detect(image_bytes_len: int) -> List[Detection]:
    """Deterministic-ish mock detector used when no real detector is installed."""
    random.seed(image_bytes_len)  # reproducible per-file for demo purposes
    n_detections = random.randint(1, 3)
    detections = []
    for _ in range(n_detections):
        common, sci, group, status = random.choice(_MOCK_SPECIES_POOL)
        x1, y1 = round(random.uniform(0.05, 0.4), 3), round(random.uniform(0.05, 0.4), 3)
        x2, y2 = round(x1 + random.uniform(0.2, 0.4), 3), round(y1 + random.uniform(0.2, 0.4), 3)
        detections.append(
            Detection(
                species_common_name=common,
                species_scientific_name=sci,
                species_group=group,
                conservation_status=status,
                confidence_score=round(random.uniform(0.72, 0.97), 3),
                individual_count=random.randint(1, 4),
                bounding_box=[x1, y1, min(x2, 1.0), min(y2, 1.0)],
                behavior=random.choice(["foraging", "resting", "moving", "alert"]),
            )
        )
    return detections


# --- Tier 1: SpeciesNet + MegaDetector (global, pretrained, no training needed) ---

# Very small mapping from a few SpeciesNet common names to broad taxonomic
# group + a placeholder conservation status. SpeciesNet's raw output doesn't
# include IUCN status, so this is illustrative - a production system would
# look status up from a real IUCN Red List API/dataset keyed on scientific name.
_SPECIESNET_GROUP_HINTS = {
    "aves": "bird", "mammalia": "mammal", "reptilia": "reptile",
    "amphibia": "amphibian", "insecta": "insect", "actinopterygii": "marine",
}


import logging
import sys

logger = logging.getLogger(__name__)

def _run_speciesnet(file_path: str) -> Optional[dict]:
    """
    Runs the SpeciesNet + MegaDetector ensemble on a single image via the
    documented CLI entrypoint (this ensemble is designed as a batch/CLI tool,
    not a simple in-process function call - see backend/training/README.md
    for why, and the official docs at https://github.com/google/cameratrapai).

    Returns the parsed prediction dict for this image, or None if the
    ensemble isn't installed or the call fails for any reason (caller falls
    back to the next tier).
    """
    if not _SPECIESNET_AVAILABLE:
        return None

    with tempfile.TemporaryDirectory() as tmp_dir:
        tmp_path = Path(tmp_dir)
        # run_md_and_speciesnet expects a folder of images, not a single file path
        staged_image = tmp_path / Path(file_path).name
        shutil.copy2(file_path, staged_image)
        output_json = tmp_path / "predictions.json"

        try:
            res = subprocess.run(
                [
                    sys.executable, "-m", "megadetector.detection.run_md_and_speciesnet",
                    str(tmp_path), str(output_json),
                ],
                check=True,
                capture_output=True,
                timeout=180,
            )
        except (subprocess.CalledProcessError, subprocess.TimeoutExpired, FileNotFoundError) as e:
            logger.warning(f"SpeciesNet execution failed: {e}")
            return None

        if not output_json.exists():
            return None

        with open(output_json) as f:
            data = json.load(f)

    return data


def _parse_speciesnet_prediction(data: dict) -> List[Detection]:
    """Converts MegaDetector + SpeciesNet output into our Detection objects."""
    detections: List[Detection] = []
    if not isinstance(data, dict):
        return detections

    # Format 1: MegaDetector 10 / run_md_and_speciesnet standard output
    images = data.get("images", [])
    cat_desc = data.get("classification_category_descriptions", {})
    cat_names = data.get("classification_categories", {})

    if images:
        for img_obj in images:
            for d in img_obj.get("detections", []):
                # category "1" is animal in MegaDetector
                if str(d.get("category")) != "1":
                    continue
                bbox = d.get("bbox", [])  # [x, y, w, h] normalized
                if len(bbox) != 4:
                    continue
                x, y, w, h = bbox
                
                # Check top classification
                classifications = d.get("classifications", [])
                if not classifications:
                    continue
                top_class_id, top_score = str(classifications[0][0]), float(classifications[0][1])
                
                desc = cat_desc.get(top_class_id, "")
                common_name = cat_names.get(top_class_id, "Unknown Species")
                if common_name in ("blank", "", "unknown"):
                    continue

                scientific_name = "unclassified"
                species_group = "unknown"

                if desc:
                    parts = [p.strip() for p in desc.split(";") if p.strip()]
                    if len(parts) >= 2:
                        common_name = parts[-1].title()
                        scientific_name = " ".join(parts[-3:-1]).strip().title() if len(parts) >= 3 else parts[-2].title()
                    for taxon, grp in _SPECIESNET_GROUP_HINTS.items():
                        if taxon in desc.lower():
                            species_group = grp
                            break
                else:
                    common_name = common_name.title()

                detections.append(
                    Detection(
                        species_common_name=common_name,
                        species_scientific_name=scientific_name,
                        species_group=species_group,
                        conservation_status="unknown",
                        confidence_score=round(top_score, 3),
                        individual_count=1,
                        bounding_box=[round(x, 3), round(y, 3), round(x + w, 3), round(y + h, 3)],
                        behavior="unknown",
                    )
                )

    # Format 2: Fallback for older legacy schema
    if not detections and "predictions" in data:
        for pred in data.get("predictions", []):
            prediction_label = pred.get("prediction", "")
            prediction_score = pred.get("prediction_score", 0.0)
            boxes = pred.get("detections", [])
            if prediction_label in ("blank", "", "unknown") or not boxes:
                continue
            parts = [p for p in prediction_label.split(";") if p]
            common_name = parts[-1].title() if parts else "Unknown Species"
            scientific_name = " ".join(parts[-3:-1]).strip().title() if len(parts) >= 3 else "unclassified"
            species_group = next(
                (grp for taxon, grp in _SPECIESNET_GROUP_HINTS.items() if taxon in prediction_label.lower()),
                "unknown",
            )
            for box in boxes:
                if box.get("label") != "animal":
                    continue
                x, y, w, h = box["bbox"]
                detections.append(
                    Detection(
                        species_common_name=common_name,
                        species_scientific_name=scientific_name,
                        species_group=species_group,
                        conservation_status="unknown",
                        confidence_score=round(float(prediction_score), 3),
                        individual_count=1,
                        bounding_box=[round(x, 3), round(y, 3), round(x + w, 3), round(y + h, 3)],
                        behavior="unknown",
                    )
                )

    return detections


# --- Tier 2/3: YOLOv8 (custom-finetuned or stock COCO) ---

def _get_yolo_model():
    """Lazily loads the configured YOLOv8 model (tier 2/3 fallback)."""
    if not _YOLO_AVAILABLE:
        return None
    if _model_cache["yolo_model"] is None:
        from app.config import settings
        _model_cache["yolo_model"] = YOLO(settings.YOLO_MODEL_PATH)
    return _model_cache["yolo_model"]


def _run_yolo(file_path: str, image) -> List[Detection]:
    model = _get_yolo_model()
    if model is None or image is None:
        return []

    from app.config import settings
    is_stock_model = settings.YOLO_MODEL_PATH.strip() in (
        "yolov8n.pt", "yolov8s.pt", "yolov8m.pt", "yolov8l.pt", "yolov8x.pt"
    )

    detections: List[Detection] = []
    results = model(file_path, verbose=False)
    for r in results:
        for box in r.boxes:
            cls_name = model.names[int(box.cls[0])]
            if is_stock_model and cls_name not in _COCO_ANIMAL_CLASSES:
                continue
            xyxy = box.xyxyn[0].tolist()
            detections.append(
                Detection(
                    species_common_name=cls_name.title(),
                    species_scientific_name="unclassified",
                    species_group="mammal" if cls_name != "bird" else "bird",
                    conservation_status="unknown",
                    confidence_score=round(float(box.conf[0]), 3),
                    individual_count=1,
                    bounding_box=[round(v, 3) for v in xyxy],
                    behavior="unknown",
                )
            )
    return detections


def analyze_image(file_path: str) -> dict:
    """
    Main entry point for the Image Analysis Engine.
    Tries SpeciesNet+MegaDetector first (global species coverage, no training
    needed), falls back to YOLOv8 (custom-finetuned, then stock COCO), and
    finally to a mock detector so the platform stays demoable regardless of
    which heavy dependencies are installed.
    Returns a dict with detections, quality score, processing time, and which
    tier actually produced the result (useful for debugging/demos).
    """
    start = time.time()

    image = None
    if cv2 is not None:
        image = cv2.imread(file_path)

    quality_score = assess_image_quality(image)

    detections: List[Detection] = []
    model_used = "mock_detector"

    speciesnet_pred = _run_speciesnet(file_path)
    if speciesnet_pred is not None:
        detections = _parse_speciesnet_prediction(speciesnet_pred)
        model_used = "speciesnet+megadetector"

    if not detections and image is not None:
        yolo_detections = _run_yolo(file_path, image)
        if yolo_detections:
            from app.config import settings
            is_stock = settings.YOLO_MODEL_PATH.strip() in (
                "yolov8n.pt", "yolov8s.pt", "yolov8m.pt", "yolov8l.pt", "yolov8x.pt"
            )
            detections = yolo_detections
            model_used = "yolov8_stock" if is_stock else "yolov8_finetuned"

    if not detections:
        with open(file_path, "rb") as f:
            size = len(f.read())
        detections = _mock_detect(size)
        model_used = "mock_detector"

    processing_time_ms = round((time.time() - start) * 1000, 2)

    return {
        "detections": detections,
        "quality_score": quality_score,
        "processing_time_ms": processing_time_ms,
        "model_used": model_used,
    }
