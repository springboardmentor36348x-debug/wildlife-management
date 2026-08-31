import io
import json
import os
from functools import lru_cache

import numpy as np

BASE_DIR = os.path.dirname(os.path.dirname(os.path.abspath(__file__)))
ML_MODELS_DIR = os.path.join(BASE_DIR, "ml_models")
MODEL_PATH = os.path.join(ML_MODELS_DIR, "audio_species_model.joblib")
LABELS_PATH = os.path.join(ML_MODELS_DIR, "audio_labels.json")

SAMPLE_RATE = 22050
N_MFCC = 20


class ModelNotTrainedError(RuntimeError):
    pass


def extract_features(audio_bytes: bytes) -> np.ndarray:
    import librosa
    import soundfile as sf

    y, sr = sf.read(io.BytesIO(audio_bytes))
    if y.ndim > 1:
        y = y.mean(axis=1)
    if sr != SAMPLE_RATE:
        y = librosa.resample(y.astype(np.float32), orig_sr=sr, target_sr=SAMPLE_RATE)
        sr = SAMPLE_RATE

    mfcc = librosa.feature.mfcc(y=y, sr=sr, n_mfcc=N_MFCC)
    centroid = librosa.feature.spectral_centroid(y=y, sr=sr)
    zcr = librosa.feature.zero_crossing_rate(y)

    features = np.concatenate([
        mfcc.mean(axis=1), mfcc.std(axis=1),
        centroid.mean(axis=1), zcr.mean(axis=1),
    ])
    return features


@lru_cache(maxsize=1)
def _load_model():
    if not os.path.exists(MODEL_PATH) or not os.path.exists(LABELS_PATH):
        raise ModelNotTrainedError(
            "Bioacoustic model not found. Add labeled audio clips under "
            "backend/datasets/audio/<species_name>/*.wav and run "
            "`python scripts/train_audio_classifier.py` from the backend/ folder."
        )
    import joblib
    model = joblib.load(MODEL_PATH)
    with open(LABELS_PATH, "r") as f:
        labels = json.load(f)
    return model, labels


def predict_species(audio_bytes: bytes):
    model, labels = _load_model()
    features = extract_features(audio_bytes).reshape(1, -1)
    probs = model.predict_proba(features)[0]
    top_idx = int(np.argmax(probs))
    confidence = float(probs[top_idx])
    label = labels[str(top_idx)]
    return label, confidence


def is_model_ready() -> bool:
    return os.path.exists(MODEL_PATH) and os.path.exists(LABELS_PATH)