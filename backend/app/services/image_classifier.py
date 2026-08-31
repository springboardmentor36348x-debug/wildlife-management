"""
Wildlife Image Analysis Engine
-------------------------------
Loads a trained species-classification model (MobileNetV2 transfer learning,
see scripts/train_image_classifier.py) and runs inference on an uploaded image.

Model + label files are produced by the training script and expected at:
    backend/app/ml_models/image_species_model.h5
    backend/app/ml_models/image_labels.json
"""
import io
import json
import os
from functools import lru_cache

import numpy as np
from PIL import Image

BASE_DIR = os.path.dirname(os.path.dirname(os.path.abspath(__file__)))  # backend/app
ML_MODELS_DIR = os.path.join(BASE_DIR, "ml_models")
MODEL_PATH = os.path.join(ML_MODELS_DIR, "image_species_model.h5")
LABELS_PATH = os.path.join(ML_MODELS_DIR, "image_labels.json")

IMG_SIZE = (224, 224)

# Below this confidence, the model is likely being shown something outside
# its 10 trained species — since it's a closed-set classifier it will always
# return one of those 10 labels regardless, so we flag low-confidence results
# instead of presenting a wrong species name as if it were reliable.
LOW_CONFIDENCE_THRESHOLD = 0.5


class ModelNotTrainedError(RuntimeError):
    pass


@lru_cache(maxsize=1)
def _load_model():
    if not os.path.exists(MODEL_PATH) or not os.path.exists(LABELS_PATH):
        raise ModelNotTrainedError(
            "Image classification model not found. Run "
            "`python scripts/train_image_classifier.py` from the backend/ "
            "folder first (this trains on backend/datasets/Bird Speciees Dataset)."
        )

    # Imported lazily so the whole API doesn't require tensorflow just to boot
    import tensorflow as tf

    model = tf.keras.models.load_model(MODEL_PATH)
    with open(LABELS_PATH, "r") as f:
        labels = json.load(f)  # {"0": "AMERICAN GOLDFINCH", ...}
    return model, labels


def predict_species(image_bytes: bytes):
    """
    Returns (predicted_label: str, confidence: float 0-1).

    If confidence is below LOW_CONFIDENCE_THRESHOLD, the label returned is
    "Unrecognized species (low confidence)" instead of the raw top-1 guess —
    the model is a closed-set classifier and will always pick one of its
    trained species even for unrelated images, so a low score is the only
    signal available that the image likely isn't one of them.
    """
    model, labels = _load_model()

    img = Image.open(io.BytesIO(image_bytes)).convert("RGB").resize(IMG_SIZE)
    arr = np.asarray(img, dtype=np.float32) / 255.0
    arr = np.expand_dims(arr, axis=0)

    predictions = model.predict(arr, verbose=0)[0]
    top_idx = int(np.argmax(predictions))
    confidence = float(predictions[top_idx])
    label = labels[str(top_idx)]

    if confidence < LOW_CONFIDENCE_THRESHOLD:
        return "Unrecognized species (low confidence)", confidence

    return label, confidence


def is_model_ready() -> bool:
    return os.path.exists(MODEL_PATH) and os.path.exists(LABELS_PATH)