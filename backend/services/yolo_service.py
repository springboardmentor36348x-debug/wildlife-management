"""
YOLOv9 inference service for wildlife species detection.

Uses the EXACT same pipeline as detect.py from the SkalskiP/WongKinYiu yolov9 repo:
  DetectMultiBackend -> letterbox -> inference -> non_max_suppression -> scale_boxes -> Annotator
This mirrors what was used in Colab training/testing, so results should match exactly.
"""
import io
import os
import sys
import base64
import logging
import tempfile

import cv2
import numpy as np
from PIL import Image

logger = logging.getLogger(__name__)

# ─── Paths ───────────────────────────────────────────────────────────────────
BACKEND_DIR    = os.path.dirname(os.path.dirname(__file__))
YOLOV9_REPO    = os.path.join(BACKEND_DIR, "yolov9_repo")
MODEL_PATH     = os.path.join(BACKEND_DIR, "weights", "best.pt")

# Add yolov9_repo to sys.path first so its submodules resolve
if YOLOV9_REPO not in sys.path:
    sys.path.insert(0, YOLOV9_REPO)

# ─── Lazy-loaded globals ─────────────────────────────────────────────────────
_model  = None
_device = None
_stride = None
_names  = None
_pt     = None

# ─── Load model ──────────────────────────────────────────────────────────────
def _load_model():
    """Load using DetectMultiBackend — exactly like detect.py does."""
    global _model, _device, _stride, _names, _pt

    if _model is not None:
        return _model, _device, _stride, _names, _pt

    if not os.path.exists(MODEL_PATH):
        raise FileNotFoundError(f"Model file not found: {MODEL_PATH}")
    if not os.path.exists(YOLOV9_REPO):
        raise FileNotFoundError(f"YOLOv9 repo not found: {YOLOV9_REPO}")

    # Ensure models package resolves from yolov9_repo
    import models as backend_models
    yolov9_models_dir = os.path.join(YOLOV9_REPO, "models")
    if hasattr(backend_models, "__path__"):
        if yolov9_models_dir not in list(backend_models.__path__):
            backend_models.__path__.append(yolov9_models_dir)
    else:
        backend_models.__path__ = [yolov9_models_dir]

    from models.common import DetectMultiBackend
    from utils.torch_utils import select_device

    logger.info(f"Loading YOLOv9 model via DetectMultiBackend from: {MODEL_PATH}")
    device = select_device("cpu")
    model  = DetectMultiBackend(MODEL_PATH, device=device, dnn=False, fp16=False)

    _model  = model
    _device = device
    _stride = model.stride
    _names  = model.names
    _pt     = model.pt

    logger.info(f"Model loaded! Classes: {_names}")
    return _model, _device, _stride, _names, _pt


# ─── Main inference function ──────────────────────────────────────────────────
def run_detection(image_bytes: bytes, conf_threshold: float = 0.25, img_size: int = 640):
    """
    Run YOLOv9 inference — mirrors detect.py exactly.
    Returns dict with primary_species, confidence, detections list, annotated_image base64.
    """
    import torch
    from utils.general import non_max_suppression, scale_boxes, check_img_size
    from utils.plots import Annotator, colors

    model, device, stride, names, pt = _load_model()

    # ── Pre-process ──────────────────────────────────────────────────────────
    img_pil   = Image.open(io.BytesIO(image_bytes)).convert("RGB")
    im0       = np.array(img_pil)[:, :, ::-1].copy()   # RGB→BGR (cv2 format)

    imgsz = check_img_size((img_size, img_size), s=stride)

    # Letterbox resize (same as LoadImages in detect.py)
    im_lb, ratio, (dw, dh) = _letterbox(im0, new_shape=imgsz, auto=pt)

    im = im_lb.transpose((2, 0, 1))[::-1]              # HWC→CHW, BGR→RGB
    im = np.ascontiguousarray(im)
    im = torch.from_numpy(im).to(device)
    im = im.float() / 255.0
    if len(im.shape) == 3:
        im = im[None]                                   # add batch dim

    # ── Inference ────────────────────────────────────────────────────────────
    model.warmup(imgsz=(1, 3, *imgsz))
    with torch.no_grad():
        pred = model(im, augment=False, visualize=False)

    # ── NMS ──────────────────────────────────────────────────────────────────
    pred = non_max_suppression(pred, conf_threshold, 0.45, None, False, max_det=1000)

    # ── Process detections ───────────────────────────────────────────────────
    detections    = []
    species_counts = {}

    annotator = Annotator(im0.copy(), line_width=3, example=str(names))

    for det in pred:           # one image only
        if len(det):
            # Scale boxes back to original image coords
            det[:, :4] = scale_boxes(im.shape[2:], det[:, :4], im0.shape).round()

            for *xyxy, conf, cls in reversed(det):
                cls_id       = int(cls)
                raw_name     = names.get(cls_id, f"Species_{cls_id}") if isinstance(names, dict) else names[cls_id]
                species_name = str(raw_name).replace("_", " ").title()
                conf_pct     = round(float(conf) * 100, 2)
                box          = [round(float(v), 1) for v in xyxy]   # [x1,y1,x2,y2]

                detections.append({
                    "class_id":     cls_id,
                    "species_name": species_name,
                    "confidence":   conf_pct,
                    "box":          box
                })
                species_counts[species_name] = species_counts.get(species_name, 0) + 1

                # Draw box using yolov9 Annotator (same as detect.py)
                label = f"{species_name} {conf_pct}%"
                annotator.box_label(xyxy, label, color=colors(cls_id, True))

    # ── Sort by confidence descending ────────────────────────────────────────
    detections.sort(key=lambda d: d["confidence"], reverse=True)

    primary_species = detections[0]["species_name"] if detections else "No Wildlife Species Detected"
    top_confidence  = detections[0]["confidence"]   if detections else 0.0

    # ── Encode annotated image as base64 JPEG ────────────────────────────────
    annotated_bgr = annotator.result()
    annotated_rgb = annotated_bgr[:, :, ::-1]         # BGR→RGB for PIL
    buf = io.BytesIO()
    Image.fromarray(annotated_rgb).save(buf, format="JPEG", quality=90)
    annotated_b64 = "data:image/jpeg;base64," + base64.b64encode(buf.getvalue()).decode("utf-8")

    return {
        "status":          "success",
        "total_detected":  len(detections),
        "primary_species": primary_species,
        "top_confidence":  top_confidence,
        "detections":      detections,
        "species_summary": species_counts,
        "annotated_image": annotated_b64
    }


# ─── Letterbox helper ─────────────────────────────────────────────────────────
def _letterbox(img, new_shape=(640, 640), color=(114, 114, 114), auto=True,
               scaleFill=False, scaleup=True, stride=32):
    """Resize and pad image while meeting stride-multiple constraints."""
    shape = img.shape[:2]                              # current HxW
    if isinstance(new_shape, int):
        new_shape = (new_shape, new_shape)

    r = min(new_shape[0] / shape[0], new_shape[1] / shape[1])
    if not scaleup:
        r = min(r, 1.0)

    ratio     = r, r
    new_unpad = int(round(shape[1] * r)), int(round(shape[0] * r))
    dw = new_shape[1] - new_unpad[0]
    dh = new_shape[0] - new_unpad[1]

    if auto:
        dw = np.mod(dw, stride)
        dh = np.mod(dh, stride)
    elif scaleFill:
        dw, dh    = 0.0, 0.0
        new_unpad = (new_shape[1], new_shape[0])
        ratio     = new_shape[1] / shape[1], new_shape[0] / shape[0]

    dw /= 2
    dh /= 2

    if shape[::-1] != new_unpad:
        img = cv2.resize(img, new_unpad, interpolation=cv2.INTER_LINEAR)

    top    = int(round(dh - 0.1))
    bottom = int(round(dh + 0.1))
    left   = int(round(dw - 0.1))
    right  = int(round(dw + 0.1))
    img = cv2.copyMakeBorder(img, top, bottom, left, right,
                             cv2.BORDER_CONSTANT, value=color)
    return img, ratio, (dw, dh)
