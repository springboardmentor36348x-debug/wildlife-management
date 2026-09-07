"""
Wildlife Image Analysis Engine (Milestone 2, spec section 4.3 / 4.5).

ARCHITECTURE NOTE:
Species identification uses a tiered strategy, best available option first:

1. SpeciesNet (Google) - pretrained global wildlife identification pipeline.
   SpeciesNet's official run_model command runs the detector + classifier
   ensemble and supports 2000+ species worldwide.
2. A custom-finetuned YOLOv8 checkpoint, if YOLO_MODEL_PATH is set.
3. Stock YOLOv8 COCO checkpoint, filtered to animal classes.
4. A mock detector, so the rest of the platform remains demoable even when
   heavy ML dependencies are unavailable.

Each tier is optional at import time. The engine degrades gracefully to the
next tier instead of crashing.
"""

from __future__ import annotations

import json
import logging
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
    )
except ImportError:  # pragma: no cover
    _SPECIESNET_AVAILABLE = False


# COCO classes that loosely map to wildlife-relevant animals in the stock
# YOLOv8 checkpoint.
_COCO_ANIMAL_CLASSES = {
    "bird",
    "cat",
    "dog",
    "horse",
    "sheep",
    "cow",
    "elephant",
    "bear",
    "zebra",
    "giraffe",
}


_MOCK_SPECIES_POOL = [
    ("Bengal Tiger", "Panthera tigris tigris", "mammal", "endangered"),
    ("Indian Elephant", "Elephas maximus indicus", "mammal", "endangered"),
    ("Spotted Deer", "Axis axis", "mammal", "least_concern"),
    ("Indian Peafowl", "Pavo cristatus", "bird", "least_concern"),
    ("Sloth Bear", "Melursus ursinus", "mammal", "vulnerable"),
    ("Indian Rock Python", "Python molurus", "reptile", "near_threatened"),
]


_model_cache = {
    "yolo_model": None,
}


@dataclass
class Detection:
    species_common_name: str
    species_scientific_name: str
    species_group: str
    conservation_status: str
    confidence_score: float
    individual_count: int
    bounding_box: List[float] = field(default_factory=list)
    behavior: str = "unknown"


def assess_image_quality(image: "np.ndarray") -> float:
    """
    Simple heuristic quality score (0-1) based on blur and brightness.
    """
    if cv2 is None or image is None:
        return 0.75

    gray = cv2.cvtColor(image, cv2.COLOR_BGR2GRAY)

    blur_score = cv2.Laplacian(
        gray,
        cv2.CV_64F,
    ).var()

    brightness = gray.mean()

    blur_component = min(
        blur_score / 500.0,
        1.0,
    )

    brightness_component = (
        1.0 - abs(brightness - 128) / 128.0
    )

    quality = round(
        0.6 * blur_component
        + 0.4 * brightness_component,
        3,
    )

    return max(
        0.0,
        min(quality, 1.0),
    )


def _mock_detect(image_bytes_len: int) -> List[Detection]:
    """
    Deterministic-ish mock detector used when no real detector is installed.
    """
    random.seed(image_bytes_len)

    n_detections = random.randint(1, 3)

    detections = []

    for _ in range(n_detections):
        common, sci, group, status = random.choice(
            _MOCK_SPECIES_POOL
        )

        x1 = round(
            random.uniform(0.05, 0.4),
            3,
        )

        y1 = round(
            random.uniform(0.05, 0.4),
            3,
        )

        x2 = round(
            x1 + random.uniform(0.2, 0.4),
            3,
        )

        y2 = round(
            y1 + random.uniform(0.2, 0.4),
            3,
        )

        detections.append(
            Detection(
                species_common_name=common,
                species_scientific_name=sci,
                species_group=group,
                conservation_status=status,
                confidence_score=round(
                    random.uniform(0.72, 0.97),
                    3,
                ),
                individual_count=random.randint(1, 4),
                bounding_box=[
                    x1,
                    y1,
                    min(x2, 1.0),
                    min(y2, 1.0),
                ],
                behavior=random.choice(
                    [
                        "foraging",
                        "resting",
                        "moving",
                        "alert",
                    ]
                ),
            )
        )

    return detections


# ---------------------------------------------------------------------------
# Tier 1: SpeciesNet
# ---------------------------------------------------------------------------

# SpeciesNet's raw output does not directly provide IUCN status.
# These hints only map broad taxonomic groups.
_SPECIESNET_GROUP_HINTS = {
    "aves": "bird",
    "mammalia": "mammal",
    "reptilia": "reptile",
    "amphibia": "amphibian",
    "insecta": "insect",
    "actinopterygii": "marine",
}


logger = logging.getLogger(__name__)


def _run_speciesnet(file_path: str) -> Optional[dict]:
    """
    Run the official SpeciesNet ensemble on a single image.

    SpeciesNet's run_model command handles the detector and classifier
    internally, so a separate MegaDetector installation is not required.
    """

    if not _SPECIESNET_AVAILABLE:
        return None

    try:
        with tempfile.TemporaryDirectory() as tmp_dir:

            tmp_path = (
                Path(tmp_dir)
                / Path(file_path).name
            )

            output_json = (
                Path(tmp_dir)
                / "predictions.json"
            )

            shutil.copy2(
                file_path,
                tmp_path,
            )

            subprocess.run(
                [
                    sys.executable,
                    "-m",
                    "speciesnet.scripts.run_model",
                    "--folders",
                    tmp_dir,
                    "--predictions_json",
                    str(output_json),
                ],
                check=True,
                capture_output=True,
                text=True,
                timeout=300,
            )

            if not output_json.exists():
                return None

            with open(
                output_json,
                "r",
                encoding="utf-8",
            ) as f:
                return json.load(f)

    except Exception as exc:
        logger.warning(
            "SpeciesNet analysis failed: %s",
            exc,
        )
        return None


def _parse_speciesnet_prediction(
    data,
) -> List[Detection]:
    """
    Convert SpeciesNet run_model output into our Detection model.
    """

    detections: List[Detection] = []

    for pred in data.get(
        "predictions",
        [],
    ):

        prediction_label = str(
            pred.get(
                "prediction",
                "",
            )
        ).strip()

        prediction_score = float(
            pred.get(
                "prediction_score",
                0.0,
            )
            or 0.0
        )

        if not prediction_label:
            continue

        if prediction_label.lower() in (
            "blank",
            "unknown",
        ):
            continue

        # SpeciesNet taxonomy labels are generally represented
        # as semicolon-separated paths.
        parts = [
            p.strip()
            for p in prediction_label.split(";")
            if p.strip()
        ]

        common_name = (
            parts[-1].title()
            if parts
            else "Unknown Species"
        )

        # Use the available taxonomy information as the
        # scientific-name field when possible.
        scientific_name = "unclassified"

        if len(parts) >= 2:
            scientific_name = parts[-1]

        species_group = next(
            (
                grp
                for taxon, grp
                in _SPECIESNET_GROUP_HINTS.items()
                if taxon in prediction_label.lower()
            ),
            "unknown",
        )

        # Find animal detections returned by SpeciesNet.
        animal_boxes = [
            d
            for d in pred.get(
                "detections",
                []
            )
            if (
                d.get("category") == "1"
                or d.get("label") == "animal"
            )
        ]

        if animal_boxes:

            best_box = max(
                animal_boxes,
                key=lambda d: float(
                    d.get(
                        "conf",
                        0.0,
                    )
                ),
            )

            bbox = best_box.get(
                "bbox",
                [
                    0.0,
                    0.0,
                    1.0,
                    1.0,
                ],
            )

            # SpeciesNet/MegaDetector-style boxes are
            # [x, y, width, height].
            x, y, w, h = bbox

            detection_confidence = float(
                best_box.get(
                    "conf",
                    0.0,
                )
                or 0.0
            )

            confidence = max(
                prediction_score,
                detection_confidence,
            )

            bounding_box = [
                round(float(x), 3),
                round(float(y), 3),
                round(float(x + w), 3),
                round(float(y + h), 3),
            ]

        else:

            confidence = prediction_score

            bounding_box = [
                0.0,
                0.0,
                1.0,
                1.0,
            ]

        detections.append(
            Detection(
                species_common_name=common_name,
                species_scientific_name=scientific_name,
                species_group=species_group,
                conservation_status="unknown",
                confidence_score=round(
                    confidence,
                    3,
                ),
                individual_count=1,
                bounding_box=bounding_box,
                behavior="unknown",
            )
        )

    return detections


# ---------------------------------------------------------------------------
# Tier 2/3: YOLOv8
# ---------------------------------------------------------------------------


def _get_yolo_model():
    """
    Lazily loads the configured YOLOv8 model.
    """

    if not _YOLO_AVAILABLE:
        return None

    if _model_cache["yolo_model"] is None:

        from app.config import settings

        _model_cache["yolo_model"] = YOLO(
            settings.YOLO_MODEL_PATH
        )

    return _model_cache["yolo_model"]


def _run_yolo(
    file_path: str,
    image,
) -> List[Detection]:

    model = _get_yolo_model()

    if model is None or image is None:
        return []

    from app.config import settings

    is_stock_model = (
        settings.YOLO_MODEL_PATH.strip()
        in (
            "yolov8n.pt",
            "yolov8s.pt",
            "yolov8m.pt",
            "yolov8l.pt",
            "yolov8x.pt",
        )
    )

    detections: List[Detection] = []

    results = model(
        file_path,
        verbose=False,
    )

    for r in results:

        for box in r.boxes:

            cls_name = model.names[
                int(box.cls[0])
            ]

            if (
                is_stock_model
                and cls_name
                not in _COCO_ANIMAL_CLASSES
            ):
                continue

            xyxy = box.xyxyn[
                0
            ].tolist()

            detections.append(
                Detection(
                    species_common_name=cls_name.title(),
                    species_scientific_name="unclassified",
                    species_group=(
                        "mammal"
                        if cls_name != "bird"
                        else "bird"
                    ),
                    conservation_status="unknown",
                    confidence_score=round(
                        float(box.conf[0]),
                        3,
                    ),
                    individual_count=1,
                    bounding_box=[
                        round(v, 3)
                        for v in xyxy
                    ],
                    behavior="unknown",
                )
            )

    return detections


# ---------------------------------------------------------------------------
# Main analysis entry point
# ---------------------------------------------------------------------------


def analyze_image(
    file_path: str,
) -> dict:
    """
    Main entry point for the Image Analysis Engine.

    Tries SpeciesNet first for global species coverage, then falls back
    to YOLOv8, and finally to the mock detector.

    Returns:
        detections
        quality score
        processing time
        model actually used
    """

    start = time.time()

    image = None

    if cv2 is not None:
        image = cv2.imread(
            file_path
        )

    quality_score = assess_image_quality(
        image
    )

    detections: List[Detection] = []

    model_used = "mock_detector"

    # ---------------------------------------------------------
    # Tier 1: SpeciesNet
    # ---------------------------------------------------------

    speciesnet_pred = _run_speciesnet(
        file_path
    )

    if speciesnet_pred is not None:

        detections = _parse_speciesnet_prediction(
            speciesnet_pred
        )

        if detections:
            model_used = "speciesnet"

    # ---------------------------------------------------------
    # Tier 2/3: YOLOv8
    # ---------------------------------------------------------

    if not detections and image is not None:

        yolo_detections = _run_yolo(
            file_path,
            image,
        )

        if yolo_detections:

            from app.config import settings

            is_stock = (
                settings.YOLO_MODEL_PATH.strip()
                in (
                    "yolov8n.pt",
                    "yolov8s.pt",
                    "yolov8m.pt",
                    "yolov8l.pt",
                    "yolov8x.pt",
                )
            )

            detections = yolo_detections

            model_used = (
                "yolov8_stock"
                if is_stock
                else "yolov8_finetuned"
            )

    # ---------------------------------------------------------
    # Tier 4: Mock detector
    # ---------------------------------------------------------

    if not detections:

        with open(
            file_path,
            "rb",
        ) as f:

            size = len(
                f.read()
            )

        detections = _mock_detect(
            size
        )

        model_used = "mock_detector"

    processing_time_ms = round(
        (time.time() - start) * 1000,
        2,
    )

    return {
        "detections": detections,
        "quality_score": quality_score,
        "processing_time_ms": processing_time_ms,
        "model_used": model_used,
    }
