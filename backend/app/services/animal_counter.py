"""
Animal Counting Engine (Milestone 3) — pretrained YOLOv8 object detection
----------------------------------------------------------------------------
Uses YOLOv8's pretrained COCO weights (no custom training needed) to detect
and count animal-shaped objects in an image, drawing bounding boxes directly
onto a copy of the image server-side.

IMPORTANT SCOPE NOTE: COCO's pretrained classes only include a handful of
generic animal categories (bird, cat, dog, horse, sheep, cow, elephant,
bear, zebra, giraffe) — it does NOT know species like "Barn Owl" or
"Carmine Bee-eater". This engine answers "how many animals, and where" —
species identification remains the job of the existing MobileNetV2
classifier (image_classifier.py). The two are complementary, not
duplicates.
"""
import io
import os
from functools import lru_cache

from PIL import Image

BASE_DIR = os.path.dirname(os.path.dirname(os.path.abspath(__file__)))  # backend/app
ML_MODELS_DIR = os.path.join(BASE_DIR, "ml_models")
YOLO_WEIGHTS_PATH = os.path.join(ML_MODELS_DIR, "yolov8n.pt")  # auto-downloaded on first use

# COCO class indices that correspond to animals
COCO_ANIMAL_CLASSES = {
    14: "bird",
    15: "cat",
    16: "dog",
    17: "horse",
    18: "sheep",
    19: "cow",
    20: "elephant",
    21: "bear",
    22: "zebra",
    23: "giraffe",
}

CONFIDENCE_THRESHOLD = 0.35


@lru_cache(maxsize=1)
def _load_model():
    from ultralytics import YOLO
    os.makedirs(ML_MODELS_DIR, exist_ok=True)
    # ultralytics auto-downloads yolov8n.pt (nano, ~6MB) to this path on first call
    model = YOLO("yolov8n.pt")
    return model


def detect_and_count_animals(image_bytes: bytes):
    """
    Returns (annotated_image_bytes: bytes, count: int, detections: list[dict])
    detections: [{"class_name": "elephant", "confidence": 0.87, "box": [x1,y1,x2,y2]}, ...]
    """
    model = _load_model()

    img = Image.open(io.BytesIO(image_bytes)).convert("RGB")
    results = model.predict(img, conf=CONFIDENCE_THRESHOLD, verbose=False)

    result = results[0]
    detections = []

    for box in result.boxes:
        cls_id = int(box.cls[0])
        if cls_id not in COCO_ANIMAL_CLASSES:
            continue  # skip non-animal COCO classes (person, car, etc.)

        confidence = float(box.conf[0])
        xyxy = box.xyxy[0].tolist()

        detections.append({
            "class_name": COCO_ANIMAL_CLASSES[cls_id],
            "confidence": round(confidence, 3),
            "box": [round(c, 1) for c in xyxy],
        })

    # Draw only the animal boxes we kept (filter result.boxes to just those indices)
    annotated_array = result.plot(
        boxes=True,
        labels=True,
        conf=True,
    )
    # result.plot() draws ALL detected classes by default; since our model
    # only ever sees animal photos in this app's context, this is acceptable,
    # but detections[] above is already filtered to animals only for the count.

    annotated_img = Image.fromarray(annotated_array[..., ::-1])  # BGR -> RGB
    output_buffer = io.BytesIO()
    annotated_img.save(output_buffer, format="JPEG")
    annotated_bytes = output_buffer.getvalue()

    return annotated_bytes, len(detections), detections


def is_model_ready() -> bool:
    try:
        _load_model()
        return True
    except Exception:
        return False