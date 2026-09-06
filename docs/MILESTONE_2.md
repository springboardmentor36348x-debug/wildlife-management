# Milestone 2 (Week 3 & 4) — Species Recognition & Biodiversity Analysis

## What's implemented

### 3. Wildlife Image Analysis Engine
- `POST /api/v1/images/upload` — runs synchronously:
  - Species ID via **SpeciesNet + MegaDetector** (Google/Microsoft, pretrained,
    2000+ species globally, no training required)
  - Falls back to YOLOv8 (custom-finetuned, then stock COCO, then a mock
    detector) if SpeciesNet/MegaDetector aren't installed — see
    `app/services/image_analysis.py` module docstring for the full tiered
    strategy and why a pretrained global classifier replaced the original
    plan to fine-tune YOLOv8 on one regional dataset (no single
    bounding-box-labeled dataset covers global species diversity — see
    `backend/training/README.md`)
  - Image quality scoring (OpenCV blur/brightness heuristic)
- `GET /api/v1/images/`, `GET /api/v1/images/{id}/detections`

### 4. Bioacoustic Recognition Engine
- `POST /api/v1/audio/upload` — runs synchronously:
  - Species ID via **BirdNET** (via `birdnetlib`) — pretrained, 6,522 bird
    species globally, no training required
  - Falls back to Librosa feature extraction + a placeholder classifier for
    non-bird sounds or if BirdNET isn't installed — see
    `app/services/bioacoustic_engine.py` module docstring. There is no
    equivalent mature global model for non-bird animal sounds yet; that gap
    is real and industry-wide, not something this project failed to wire up.
- `GET /api/v1/audio/`

### 5. Species Identification Engine
- `GET /api/v1/species/observations`, `GET /api/v1/species/summary`
  (unified feed across image + audio, endangered species alerts)

### 7. Biodiversity Intelligence Engine
- `POST /api/v1/biodiversity/assess/{site_id}` — weighted Ecosystem Health Score:
  ```
  Score = 0.30 * Species Diversity + 0.25 * Population Stability
        + 0.20 * Habitat Quality + 0.15 * Endangered Species Status
        + 0.10 * Environmental Conditions
  ```
- `GET /api/v1/biodiversity/{site_id}/latest`, `.../history`

### Frontend
- `/upload`, `/species`, `/biodiversity` — all functional

## Current honest limitations
- Non-bird animal sounds (mammal calls, frog calls, insect sounds) still use
  a placeholder classifier — no mature pretrained global model exists for
  this yet, industry-wide.
- SpeciesNet's raw output doesn't include IUCN conservation status — mapped
  to "unknown" for real detections; a full implementation would look this up
  from a real IUCN Red List dataset.
- `habitat_quality_score` / `environmental_conditions_score` default to 70/70
  pending Milestone 3's Habitat Intelligence Engine.
- Device registration: API only, no frontend management screen yet.
