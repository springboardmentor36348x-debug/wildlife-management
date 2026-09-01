"""
Wildlife Image Analysis Engine (Milestone 2, FR-3/FR-5).

Runs a PRETRAINED YOLOv8 model (inference only - no training pipeline)
over an uploaded camera-trap-style image and returns every detected
object filtered down to the COCO animal classes.

Why yolov8n.pt: it is the smallest/fastest Ultralytics YOLOv8 checkpoint
(~6MB), auto-downloads on first run, and its COCO base classes already
include bird, cat, dog, horse, sheep, cow, elephant, bear, zebra, and
giraffe - enough to demonstrate a real, working animal-detection
pipeline end-to-end without training anything ourselves. See
MILESTONE2_NOTES.md for what it takes to go beyond these generic
classes to specific-species recognition (e.g. Bengal tiger vs "cat").
"""
import threading

from ultralytics import YOLO

# COCO class names (from the pretrained checkpoint) that represent
# real animals. Everything else COCO can detect (person, car, chair, ...)
# is filtered out here so this endpoint only ever reports wildlife.
ANIMAL_CLASS_NAMES = {
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

_model = None
_model_lock = threading.Lock()


def _get_model() -> YOLO:
    """
    Lazily loads (and caches) the pretrained YOLOv8 nano model. Loaded
    once per process - the first request pays the model-load/weight
    download cost, every request after that reuses it.
    """
    global _model
    if _model is None:
        with _model_lock:
            if _model is None:
                _model = YOLO("yolov8n.pt")
    return _model


def detect_animals(file_path: str, confidence_threshold: float = 0.25) -> dict:
    """
    Runs inference on the image at `file_path` and returns all detected
    animal-class objects with label, confidence, and bounding box
    (x, y, width, height in original image pixel coordinates).

    Returns a dict shaped like:
        {
          "detected": bool,
          "count": int,
          "detections": [
            {"label": str, "confidence": float,
             "bbox": {"x": float, "y": float, "width": float, "height": float}},
            ...
          ],
        }
    Sorted by confidence, highest first. Gracefully returns an empty
    "detections" list (detected=False) rather than raising when nothing
    is found.
    """
    model = _get_model()
    results = model.predict(source=file_path, conf=confidence_threshold, verbose=False)

    detections: list[dict] = []
    if results:
        result = results[0]
        names = result.names
        for box in result.boxes:
            cls_id = int(box.cls[0])
            label = names.get(cls_id, str(cls_id))
            if label not in ANIMAL_CLASS_NAMES:
                continue  # not a wildlife class (e.g. "person", "backpack") - skip

            confidence = float(box.conf[0])
            x1, y1, x2, y2 = (float(v) for v in box.xyxy[0])
            detections.append(
                {
                    "label": label,
                    "confidence": round(confidence, 4),
                    "bbox": {
                        "x": round(x1, 2),
                        "y": round(y1, 2),
                        "width": round(x2 - x1, 2),
                        "height": round(y2 - y1, 2),
                    },
                }
            )

    detections.sort(key=lambda d: d["confidence"], reverse=True)
    return {
        "detected": len(detections) > 0,
        "count": len(detections),
        "detections": detections,
    }
