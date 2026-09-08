"""
Wildlife Image Analysis Engine.

Analysis strategy:

1. SpeciesNet on machines with enough RAM.
2. YOLOv8 on normal/low-memory environments where it is safe to run.
3. Mock detector as a guaranteed lightweight fallback.

SpeciesNet is intentionally disabled on Render's low-memory instances
because it can exceed the 512 MB memory limit and cause the service to
restart.
"""

from __future__ import annotations

import json
import logging
import os
import random
import shutil
import subprocess
import sys
import tempfile
import time
from dataclasses import dataclass, field
from pathlib import Path
from typing import List, Optional

import numpy as np


logger = logging.getLogger(__name__)


# ---------------------------------------------------------------------------
# Optional dependencies
# ---------------------------------------------------------------------------

try:
    import cv2
except ImportError:  # pragma: no cover
    cv2 = None


try:
    from ultralytics import YOLO

    _YOLO_AVAILABLE = True
except ImportError:  # pragma: no cover
    YOLO = None
    _YOLO_AVAILABLE = False


try:
    import importlib.util

    _SPECIESNET_INSTALLED = (
        importlib.util.find_spec("speciesnet") is not None
    )
except Exception:  # pragma: no cover
    _SPECIESNET_INSTALLED = False


# ---------------------------------------------------------------------------
# Runtime memory protection
# ---------------------------------------------------------------------------

def _get_total_memory_mb() -> Optional[float]:
    """
    Return total system RAM in MB when available.

    Linux/Render exposes this through /proc/meminfo.
    """
    try:
        meminfo = Path("/proc/meminfo")

        if not meminfo.exists():
            return None

        for line in meminfo.read_text(
            encoding="utf-8"
        ).splitlines():

            if line.startswith("MemTotal:"):
                total_kb = int(line.split()[1])
                return total_kb / 1024.0

    except (
        OSError,
        ValueError,
        IndexError,
    ):
        return None

    return None


def _is_render_environment() -> bool:
    """
    Detect Render deployment environment.
    """
    return (
        os.getenv("RENDER", "")
        .strip()
        .lower()
        == "true"
    )


def _can_run_speciesnet() -> bool:
    """
    SpeciesNet is a heavy model.

    Render's 512 MB instance cannot safely run it, so it is disabled
    there. It is also disabled on any machine with <= 1 GB RAM.
    """

    if not _SPECIESNET_INSTALLED:
        return False

    # Never run SpeciesNet on Render's low-memory service.
    if _is_render_environment():
        logger.info(
            "SpeciesNet disabled on Render low-memory runtime."
        )
        return False

    total_memory_mb = _get_total_memory_mb()

    if total_memory_mb is not None and total_memory_mb <= 1024:
        logger.info(
            "SpeciesNet disabled because available system RAM "
            "is %.0f MB.",
            total_memory_mb,
        )
        return False

    return True


def _is_low_memory_runtime() -> bool:
    """
    True for Render/free-tier or other very small-memory environments.
    """

    if _is_render_environment():
        return True

    total_memory_mb = _get_total_memory_mb()

    if total_memory_mb is not None and total_memory_mb <= 1024:
        return True

    return False


# ---------------------------------------------------------------------------
# Detection model
# ---------------------------------------------------------------------------

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
    (
        "Bengal Tiger",
        "Panthera tigris tigris",
        "mammal",
        "endangered",
    ),
    (
        "Indian Elephant",
        "Elephas maximus indicus",
        "mammal",
        "endangered",
    ),
    (
        "Spotted Deer",
        "Axis axis",
        "mammal",
        "least_concern",
    ),
    (
        "Indian Peafowl",
        "Pavo cristatus",
        "bird",
        "least_concern",
    ),
    (
        "Sloth Bear",
        "Melursus ursinus",
        "mammal",
        "vulnerable",
    ),
    (
        "Indian Rock Python",
        "Python molurus",
        "reptile",
        "near_threatened",
    ),
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
    bounding_box: List[float] = field(
        default_factory=list
    )
    behavior: str = "unknown"


# ---------------------------------------------------------------------------
# Image quality
# ---------------------------------------------------------------------------

def assess_image_quality(
    image: "np.ndarray",
) -> float:
    """
    Estimate image quality using blur and brightness.
    """

    if cv2 is None or image is None:
        return 0.75

    try:
        gray = cv2.cvtColor(
            image,
            cv2.COLOR_BGR2GRAY,
        )

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
            1.0
            - abs(brightness - 128) / 128.0
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

    except Exception:
        return 0.75


# ---------------------------------------------------------------------------
# Guaranteed lightweight fallback
# ---------------------------------------------------------------------------

def _mock_detect(
    image_bytes_len: int,
) -> List[Detection]:
    """
    Lightweight deterministic fallback.

    This guarantees that the application can still return a result when
    heavy ML models cannot run on the deployment server.
    """

    random.seed(image_bytes_len)

    detections = []

    n_detections = random.randint(
        1,
        3,
    )

    for _ in range(n_detections):

        (
            common,
            scientific,
            group,
            status,
        ) = random.choice(
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
                species_scientific_name=scientific,
                species_group=group,
                conservation_status=status,
                confidence_score=round(
                    random.uniform(
                        0.72,
                        0.97,
                    ),
                    3,
                ),
                individual_count=random.randint(
                    1,
                    4,
                ),
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
# SpeciesNet
# ---------------------------------------------------------------------------

_SPECIESNET_GROUP_HINTS = {
    "aves": "bird",
    "mammalia": "mammal",
    "reptilia": "reptile",
    "amphibia": "amphibian",
    "insecta": "insect",
    "actinopterygii": "marine",
}


def _run_speciesnet(
    file_path: str,
) -> Optional[dict]:
    """
    Run SpeciesNet only when the runtime has enough memory.

    Any normal Python/subprocess failure is caught and the caller falls
    back to YOLO or the lightweight detector.
    """

    if not _can_run_speciesnet():
        return None

    try:

        with tempfile.TemporaryDirectory() as tmp_dir:

            staged_image = (
                Path(tmp_dir)
                / Path(file_path).name
            )

            output_json = (
                Path(tmp_dir)
                / "predictions.json"
            )

            shutil.copy2(
                file_path,
                staged_image,
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
                timeout=180,
            )

            if not output_json.exists():
                logger.warning(
                    "SpeciesNet completed without producing predictions."
                )
                return None

            with open(
                output_json,
                "r",
                encoding="utf-8",
            ) as f:
                return json.load(f)

    except subprocess.TimeoutExpired:
        logger.warning(
            "SpeciesNet timed out. Falling back to another detector."
        )
        return None

    except subprocess.CalledProcessError as exc:
        logger.warning(
            "SpeciesNet process failed: %s",
            exc,
        )
        return None

    except Exception as exc:
        logger.warning(
            "SpeciesNet analysis failed: %s",
            exc,
        )
        return None


def _parse_speciesnet_prediction(
    data: dict,
) -> List[Detection]:

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

        scientific_name = "unclassified"

        if len(parts) >= 2:
            scientific_name = parts[-1]

        species_group = next(
            (
                group
                for taxon, group
                in _SPECIESNET_GROUP_HINTS.items()
                if taxon in prediction_label.lower()
            ),
            "unknown",
        )

        animal_boxes = [
            d
            for d in pred.get(
                "detections",
                [],
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
                    or 0.0
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
# YOLO
# ---------------------------------------------------------------------------

def _get_yolo_model():

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

    if image is None:
        return []

    # On a 512 MB Render instance, loading another heavy ML model can
    # also cause an OOM. Use the guaranteed lightweight fallback instead.
    if _is_low_memory_runtime():
        logger.info(
            "Skipping YOLO because the runtime has limited memory."
        )
        return []

    try:

        model = _get_yolo_model()

        if model is None:
            return []

        from app.config import settings

        model_path = settings.YOLO_MODEL_PATH.strip()

        is_stock_model = model_path in (
            "yolov8n.pt",
            "yolov8s.pt",
            "yolov8m.pt",
            "yolov8l.pt",
            "yolov8x.pt",
        )

        detections: List[Detection] = []

        results = model(
            file_path,
            verbose=False,
        )

        for result in results:

            for box in result.boxes:

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
                            "bird"
                            if cls_name == "bird"
                            else "mammal"
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

    except Exception as exc:

        logger.warning(
            "YOLO analysis failed: %s",
            exc,
        )

        return []


# ---------------------------------------------------------------------------
# Main analysis
# ---------------------------------------------------------------------------

def analyze_image(
    file_path: str,
) -> dict:
    """
    Analyze one uploaded image.

    On Render/free low-memory deployment:
        SpeciesNet -> skipped
        YOLO -> skipped
        Lightweight fallback -> immediate result

    On a sufficiently powerful machine:
        SpeciesNet -> YOLO -> fallback
    """

    start = time.time()

    image = None

    if cv2 is not None:

        try:
            image = cv2.imread(
                file_path
            )
        except Exception as exc:
            logger.warning(
                "Could not read image: %s",
                exc,
            )

    quality_score = assess_image_quality(
        image
    )

    detections: List[Detection] = []

    model_used = "mock_detector"

    # ---------------------------------------------------------
    # Tier 1: SpeciesNet
    # ---------------------------------------------------------

    if _can_run_speciesnet():

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
    # Tier 2/3: YOLO
    # ---------------------------------------------------------

    if (
        not detections
        and image is not None
    ):

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
    # Tier 4: Guaranteed lightweight fallback
    # ---------------------------------------------------------

    if not detections:

        try:

            with open(
                file_path,
                "rb",
            ) as f:

                size = len(
                    f.read()
                )

        except Exception:

            size = 0

        detections = _mock_detect(
            size
        )

        model_used = "mock_detector"

    processing_time_ms = round(
        (time.time() - start) * 1000,
        2,
    )

    logger.info(
        "Image analysis completed using %s in %.2f ms.",
        model_used,
        processing_time_ms,
    )

    return {
        "detections": detections,
        "quality_score": quality_score,
        "processing_time_ms": processing_time_ms,
        "model_used": model_used,
    }