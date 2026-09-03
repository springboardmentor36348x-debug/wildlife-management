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


def _find_speciesnet_python() -> Optional[str]:
    """Finds the python executable for venv_speciesnet."""
    candidates = [
        Path(__file__).resolve().parents[3] / "venv_speciesnet" / "Scripts" / "python.exe",
        Path(__file__).resolve().parents[4] / "venv_speciesnet" / "Scripts" / "python.exe",
        Path("C:/Users/SWETHA/Downloads/wildlife-population-intelligence-system_5/venv_speciesnet/Scripts/python.exe"),
    ]
    for c in candidates:
        if c.exists():
            return str(c)
    return None


def _run_speciesnet(file_path: str) -> Optional[dict]:
    """Runs SpeciesNet + MegaDetector via dedicated venv or in-process."""
    python_exe = _find_speciesnet_python()
    if not python_exe and not _SPECIESNET_AVAILABLE:
        return None

    cmd_py = python_exe if python_exe else "python"
    runner_code = f"""
import json, sys
from speciesnet import SpeciesNet
import speciesnet

try:
    model = SpeciesNet(model_name=speciesnet.DEFAULT_MODEL)
    res = model.predict(filepaths=[r"{file_path}"])
    print("SPECIESNET_RESULT_START")
    print(json.dumps(res))
    print("SPECIESNET_RESULT_END")
except Exception as e:
    print(f"ERROR: {{e}}", file=sys.stderr)
"""
    try:
        proc = subprocess.run(
            [cmd_py, "-c", runner_code],
            capture_output=True,
            text=True,
            timeout=120,
        )
        if "SPECIESNET_RESULT_START" in proc.stdout:
            raw = proc.stdout.split("SPECIESNET_RESULT_START")[1].split("SPECIESNET_RESULT_END")[0].strip()
            data = json.loads(raw)
            preds = data.get("predictions", [])
            return preds[0] if preds else None
    except Exception as e:
        print(f"SpeciesNet execution error: {e}")
        return None
    return None


def _parse_speciesnet_prediction(pred: dict) -> List[Detection]:
    """Converts a SpeciesNet prediction into structured Detection objects."""
    detections: List[Detection] = []
    
    # 1. Check primary prediction or top classification
    pred_label = pred.get("prediction", "")
    classes = pred.get("classifications", {}).get("classes", [])
    scores = pred.get("classifications", {}).get("scores", [])

    candidate_label = pred_label
    confidence = float(pred.get("prediction_score", 0.0))

    if ("no cv result" in candidate_label or "blank" in candidate_label) and classes:
        # Pick top non-blank class
        for c, s in zip(classes, scores):
            if "blank" not in c and "no cv result" not in c:
                candidate_label = c
                confidence = float(s)
                break

    if not candidate_label or "no cv result" in candidate_label or "blank" in candidate_label:
        return detections

    parts = [p.strip() for p in candidate_label.split(";") if p.strip()]
    common_name = parts[-1].title() if parts else "Unknown Species"
    
    if len(parts) >= 3 and not parts[-2].isdigit() and not parts[-3].isdigit():
        scientific_name = f"{parts[-3].title()} {parts[-2].lower()}"
    else:
        scientific_name = parts[-2].title() if len(parts) >= 2 else "unclassified"

    species_group = next(
        (grp for taxon, grp in _SPECIESNET_GROUP_HINTS.items() if taxon in candidate_label.lower()),
        "mammal",
    )

    boxes = pred.get("detections", [])
    if boxes:
        for b in boxes:
            bbox = b.get("bbox", [0.1, 0.1, 0.8, 0.8])
            # Bbox format [x, y, w, h] or [x1, y1, x2, y2]
            if len(bbox) == 4:
                x1, y1, w, h = bbox
                x2, y2 = min(1.0, x1 + w), min(1.0, y1 + h)
            else:
                x1, y1, x2, y2 = 0.1, 0.1, 0.9, 0.9
            
            detections.append(
                Detection(
                    species_common_name=common_name,
                    species_scientific_name=scientific_name,
                    species_group=species_group,
                    conservation_status="least_concern" if "zebra" in common_name.lower() or "deer" in common_name.lower() else "unknown",
                    confidence_score=round(confidence, 3),
                    individual_count=1,
                    bounding_box=[round(x1, 3), round(y1, 3), round(x2, 3), round(y2, 3)],
                    behavior="active",
                )
            )
    else:
        detections.append(
            Detection(
                species_common_name=common_name,
                species_scientific_name=scientific_name,
                species_group=species_group,
                conservation_status="least_concern" if "zebra" in common_name.lower() or "deer" in common_name.lower() else "unknown",
                confidence_score=round(confidence, 3),
                individual_count=1,
                bounding_box=[0.1, 0.1, 0.9, 0.9],
                behavior="active",
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
