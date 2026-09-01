"""
Bioacoustic inference service for wildlife animal call and species classification.

Loads the trained PyTorch model weights from `backend/weights/bioacoustic_best_model.pth`
and processes uploaded audio files (.wav, .mp3, .ogg, .flac) to detect and classify
the single top recommended wildlife species sound.
"""
import io
import os
import sys
import logging
import tempfile
import numpy as np

import torch
import torch.nn as nn
import torch.nn.functional as F
import torchvision.models as models

# Check for torchaudio, fallback gracefully to librosa
try:
    import torchaudio
    import torchaudio.transforms as T
    HAS_TORCHAUDIO = True
except ImportError:
    HAS_TORCHAUDIO = False

import librosa

logger = logging.getLogger(__name__)

# ─── Paths & Parameters ───────────────────────────────────────────────────────
BACKEND_DIR = os.path.dirname(os.path.dirname(__file__))
MODEL_PATH  = os.path.join(BACKEND_DIR, "weights", "bioacoustic_best_model.pth")

SAMPLE_RATE = 22050
DURATION    = 5  # 5 Seconds
NUM_SAMPLES = SAMPLE_RATE * DURATION

# ─── Lazy-loaded globals ─────────────────────────────────────────────────────
_model      = None
_device     = None
_idx_to_cat = None
_cat_to_idx = None

# ─── Model Architecture Definition ───────────────────────────────────────────
class BioacousticClassifier(nn.Module):
    def __init__(self, num_classes: int):
        super(BioacousticClassifier, self).__init__()
        # ResNet18 backbone matching the Colab training pipeline
        self.backbone = models.resnet18(weights=None)
        in_features = self.backbone.fc.in_features
        self.backbone.fc = nn.Sequential(
            nn.Dropout(0.3),
            nn.Linear(in_features, 256),
            nn.ReLU(),
            nn.Linear(256, num_classes)
        )

    def forward(self, x):
        return self.backbone(x)


def _load_model():
    """Lazy load PyTorch model weights from backend/weights/bioacoustic_best_model.pth."""
    global _model, _device, _idx_to_cat, _cat_to_idx

    if _model is not None:
        return _model, _device, _idx_to_cat

    if not os.path.exists(MODEL_PATH):
        raise FileNotFoundError(f"Bioacoustic model file not found at: {MODEL_PATH}")

    device = torch.device("cuda" if torch.cuda.is_available() else "cpu")
    logger.info(f"Loading Bioacoustic PyTorch model on {device} from: {MODEL_PATH}")

    checkpoint = torch.load(MODEL_PATH, map_location=device)
    
    if 'idx_to_cat' in checkpoint:
        _idx_to_cat = checkpoint['idx_to_cat']
    elif 'cat_to_idx' in checkpoint:
        _cat_to_idx = checkpoint['cat_to_idx']
        _idx_to_cat = {int(v): str(k) for k, v in _cat_to_idx.items()}
    else:
        raise KeyError("Checkpoint missing class mappings ('idx_to_cat' or 'cat_to_idx')")

    num_classes = len(_idx_to_cat)
    model = BioacousticClassifier(num_classes=num_classes).to(device)
    model.load_state_dict(checkpoint['model_state_dict'])
    model.eval()

    _model  = model
    _device = device
    logger.info(f"Bioacoustic Model Loaded successfully! Total Sound Classes: {num_classes}")

    return _model, _device, _idx_to_cat


def run_audio_classification(audio_bytes: bytes, filename: str = "audio.wav"):
    """
    Process uploaded audio bytes and run PyTorch Bioacoustic Spectrogram inference.
    Returns JSON dictionary with ONLY the single top recommended species prediction.
    """
    model, device, idx_to_cat = _load_model()

    # Save incoming bytes to a temporary file so audio libraries can parse format
    suffix = os.path.splitext(filename)[1].lower()
    if not suffix or suffix not in [".wav", ".mp3", ".ogg", ".flac", ".m4a"]:
        suffix = ".wav"

    with tempfile.NamedTemporaryFile(delete=False, suffix=suffix) as tmp_file:
        tmp_file.write(audio_bytes)
        tmp_path = tmp_file.name

    try:
        if HAS_TORCHAUDIO:
            try:
                signal, sr = torchaudio.load(tmp_path)
                if sr != SAMPLE_RATE:
                    signal = T.Resample(sr, SAMPLE_RATE)(signal)
                if signal.shape[0] > 1:
                    signal = torch.mean(signal, dim=0, keepdim=True)
                if signal.shape[1] > NUM_SAMPLES:
                    signal = signal[:, :NUM_SAMPLES]
                elif signal.shape[1] < NUM_SAMPLES:
                    num_missing = NUM_SAMPLES - signal.shape[1]
                    signal = torch.nn.functional.pad(signal, (0, num_missing))

                mel_transform = T.MelSpectrogram(
                    sample_rate=SAMPLE_RATE, n_fft=1024, hop_length=512, n_mels=128
                )
                amp_to_db = T.AmplitudeToDB()
                mel_spec  = mel_transform(signal)
                mel_db    = amp_to_db(mel_spec)
                mel_3ch   = mel_db.repeat(3, 1, 1).unsqueeze(0).to(device)
            except Exception:
                mel_3ch = _process_with_librosa(tmp_path, device)
        else:
            mel_3ch = _process_with_librosa(tmp_path, device)

        # Run PyTorch Model Inference
        with torch.no_grad():
            outputs = model(mel_3ch)
            probabilities = F.softmax(outputs, dim=1)[0]

        # Extract ONLY the Single Top Recommended Species Prediction (Top 1)
        top_prob, top_idx_tensor = torch.max(probabilities, dim=0)
        top_idx = int(top_idx_tensor.item())
        
        raw_class_name = idx_to_cat.get(top_idx, f"Species_{top_idx}")
        species_name   = str(raw_class_name).replace("_", " ").title()
        confidence_pct = round(float(top_prob.item()) * 100, 2)

        # Map sound category type
        sound_category = _determine_sound_category(raw_class_name)

        return {
            "status": "success",
            "filename": filename,
            "recommended_species": species_name,
            "confidence": confidence_pct,
            "sound_category": sound_category,
            "raw_class": raw_class_name
        }

    finally:
        if os.path.exists(tmp_path):
            os.remove(tmp_path)


def _process_with_librosa(audio_path: str, device) -> torch.Tensor:
    """Fallback audio processing pipeline using Librosa."""
    y, sr = librosa.load(audio_path, sr=SAMPLE_RATE, duration=DURATION)
    
    # Pad or crop audio signal to exact 5 seconds
    target_length = NUM_SAMPLES
    if len(y) > target_length:
        y = y[:target_length]
    elif len(y) < target_length:
        y = np.pad(y, (0, target_length - len(y)), mode='constant')

    # Compute Mel-Spectrogram
    mel_spec = librosa.feature.melspectrogram(
        y=y, sr=SAMPLE_RATE, n_fft=1024, hop_length=512, n_mels=128
    )
    mel_db = librosa.power_to_db(mel_spec, ref=np.max)

    # Convert to 3-Channel Tensor
    tensor_2d  = torch.from_numpy(mel_db).float()
    tensor_3ch = tensor_2d.repeat(3, 1, 1).unsqueeze(0).to(device)
    return tensor_3ch


def _determine_sound_category(class_name: str) -> str:
    """Helper to categorize the identified audio sound."""
    name_lower = class_name.lower()
    
    if any(k in name_lower for k in ['bird', 'chirp', 'crow', 'hen', 'rooster']):
        return "Bird Call / Vocalization"
    elif any(k in name_lower for k in ['dog', 'cat', 'cow', 'pig', 'frog', 'lion', 'tiger', 'wolf', 'bear', 'elephant']):
        return "Mammal & Amphibian Call"
    elif any(k in name_lower for k in ['chainsaw', 'fireworks', 'gunshot', 'siren', 'horn']):
        return "Threat / Intrusion Event"
    elif any(k in name_lower for k in ['rain', 'thunder', 'wind', 'water', 'fire']):
        return "Environmental Soundscape"
    else:
        return "Acoustic Wildlife Event"
