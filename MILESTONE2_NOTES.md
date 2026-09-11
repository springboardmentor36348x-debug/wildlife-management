# Milestone 2 Notes — Image-Based Species Recognition

## Model used, and why

**`yolov8n.pt`** (YOLOv8 "nano"), loaded via the `ultralytics` package,
inference only — no training pipeline. It's the smallest/fastest
Ultralytics checkpoint (~6.25MB), auto-downloads from
`https://github.com/ultralytics/assets/releases/...` the first time
`detect_animals()` runs, and needs no GPU or API key. That's why it was
chosen over TensorFlow/PyTorch custom pipelines for this milestone: it's a
real, working, pretrained detector you can run on a laptop CPU in seconds,
which fits the "inference only, feasible on typical hardware" constraint
from the spec.

The model is loaded once per backend process (cached in
`vision_service.py` behind a lock) and reused for every subsequent
`/detect` call, so only the *first* request after a cold start pays the
weight-download / model-load cost (roughly 1–3 seconds locally once the
weights are cached on disk).

## Animal classes it can currently detect

`yolov8n.pt` is trained on the full 80-class COCO dataset. This milestone
filters that down to the classes that are actually animals (everything
else — person, car, chair, backpack, etc. — is discarded before the API
response is built, see `ANIMAL_CLASS_NAMES` in `vision_service.py`):

- bird
- cat
- dog
- horse
- sheep
- cow
- elephant
- bear
- zebra
- giraffe

That's it — 10 generic classes. It cannot currently tell you *which*
species of bird, or *which* big cat — everything feline shows up as
`"cat"`, every large canid/wild dog as `"dog"`, etc.

## What would need to change for specific-species recognition (Milestone 3)

To go from "generic animal class" (e.g. `"cat"`) to a specific species
(e.g. `"Bengal tiger"`), the pipeline needs a second stage, not just a
bigger version of the same model:

1. **A labeled dataset of the actual target species.** The datasets
   already registered in the Dataset Pipeline (Snapshot Serengeti,
   iNaturalist, Animal Kingdom, GBIF) are exactly this — but they need to
   actually be downloaded and their images organized into per-species
   folders/labels, not just tracked as metadata.
2. **A classification head trained on top of (or instead of) YOLO's
   detection.** Two common approaches:
   - **Two-stage pipeline:** keep YOLOv8 for "is there an animal, and
     where" (bounding box), then crop each detected box and run it
     through a separate fine-tuned classifier (e.g. a ResNet/EfficientNet
     or a YOLOv8-cls model) trained on the labeled species dataset to get
     the specific species.
   - **Fine-tune YOLOv8 itself** on a custom-labeled dataset so its own
     class list becomes species-level (`bengal_tiger`, `indian_leopard`,
     ...) instead of COCO's generic `cat`/`bear`/etc. This needs
     several hundred to thousands of labeled examples per species to be
     reliable.
3. **Training infrastructure.** Either path needs a GPU (or a lot of
   patience on CPU) and a training loop — this is explicitly out of scope
   for Milestone 2 per the brief, and is the natural Milestone 3 task
   ("Develop species identification models" in the spec's Week 3&4 plan).
4. **Confidence calibration + "unknown species" handling.** Once classes
   get more specific and the training set is smaller, the model will be
   less confident and more easily confused between visually similar
   species — Milestone 3's "Unknown species identification" /
   "confidence estimation" requirements become important here, e.g.
   falling back to the generic COCO label when species-level confidence
   is too low.

## Endpoints added

- `POST /api/v1/observations/upload-image` — multipart upload
  (`file`, optional `site_id`, optional `notes`). Creates an
  `Observation(observation_type="image")`, `site_id` nullable for the
  "no survey yet, just testing" quick mode.
- `POST /api/v1/observations/{id}/detect` — runs `detect_animals()`
  against that observation's stored image, saves the top-confidence
  label/score onto `Observation.species_label` / `confidence_score`,
  persists every detected box to a new `observation_detections` table,
  and returns all detections (label, confidence, bounding box) — safe to
  re-run on the same observation (clears and replaces prior detections).
- `GET /api/v1/observations/{id}/detections` — re-fetches the saved
  detections without re-running inference (used to redraw bounding boxes
  after a page reload).
- `GET /api/v1/observations/{id}` — fetch a single observation.
- `GET /api/v1/reports/summary` — extended with a new
  `species_breakdown: [{species, count}]` field, computed live via a
  `GROUP BY Observation.species_label` query.

## Database changes

- `observations.site_id` is now **nullable** (was required) to support
  the "no survey yet, just testing" quick-upload mode.
- New table `observation_detections` (id, observation_id, label,
  confidence, bbox_x/y/width/height, created_at) storing every detected
  animal per detection run, not just the top one.
- Both changes are plain SQLAlchemy models picked up automatically by
  `Base.metadata.create_all()` in `main.py` — no Alembic migration
  needed for a fresh `wildlife.db`. If you're reusing an **existing**
  SQLite file from Milestone 1, note that SQLite won't retroactively
  relax the `NOT NULL` constraint on `site_id` on an existing table —
  delete `wildlife.db` (or add a manual `ALTER TABLE`) and re-run
  `python -m app.seed` if you hit a "NOT NULL constraint failed" error
  on the new upload endpoint.

## New frontend files

- `src/pages/SpeciesRecognitionPage.jsx` — the guided 4-step flow
  (Upload → Detect → Results → Confirm), with drag-and-drop upload,
  a monitoring-site picker (or "no survey yet" quick mode), and a
  canvas-free bounding-box overlay (absolutely-positioned `<div>`s
  scaled from natural image size to rendered size).
- `src/pages/DashboardPage.jsx` — added a "Species Detected" card
  (simple CSS bar list, no new charting library needed) sourced from
  `GET /reports/summary`'s new `species_breakdown` field.
- `src/components/Layout.jsx` / `src/App.jsx` — new
  "Species Recognition" sidebar entry and route, restricted to
  administrator / researcher / forest_department (matching who can
  already create observations), using the same `RoleRoute` pattern as
  Datasets/Users.
- `src/api/client.js` — added `uploadObservationImage`,
  `detectSpecies`, `getObservation`, `getObservationDetections`.

## Requirements added

```
ultralytics==8.2.103
```

This pulls in `torch`, `torchvision`, `opencv-python-headless`,
`pillow`, and `numpy` as transitive dependencies — no separate pins were
added for those since `ultralytics` manages compatible versions itself.
No GPU, no API keys, no cloud services required.

## What was tested end-to-end (real data, not mocked)

Using a real photo of a dog (downloaded from a public GitHub-hosted
sample image, not a mock/stub) and a real photo of a crowded beach with
no animals in it:

1. `pip install -r requirements.txt` — clean install, `ultralytics`
   pulled `torch` etc. successfully.
2. `uvicorn app.main:app --reload` — starts cleanly; `/docs` returns
   200; `/` reports `"milestone": "2 - Image-Based Species Recognition"`.
3. `python -m app.seed` — unaffected, still creates the 4 demo users +
   5 datasets.
4. Logged in as `researcher@wildlife.org` — **Milestone 1 auth
   (JWT + refresh) unaffected.**
5. `POST /observations/upload-image` with the dog photo, no `site_id`
   → `201`, `site_id: null` (confirms the "no survey yet" quick mode).
6. `POST /observations/{id}/detect` on that observation → YOLOv8n
   downloaded its weights on first call (6.25MB), then correctly
   returned `{"label": "dog", "confidence": 0.4155, "bbox": {...}}`
   as the top detection (plus a secondary, overlapping `"cat"` guess —
   expected nano-model behavior, not a bug). Confirmed
   `Observation.species_label`/`confidence_score` were persisted.
7. Uploaded the beach photo (no animals) and ran `/detect` on it →
   `{"detected": false, "count": 0, "detections": []}`, HTTP `200` (not
   an error) — confirms the graceful "no animal detected" path.
8. `GET /observations/{id}/detections` — re-fetched the dog
   observation's saved detections without re-running inference; matched
   step 6's output exactly.
9. Uploaded the dog photo a second time and detected it again →
   `GET /reports/summary` showed `species_breakdown: [{"species": "dog",
   "count": 2}]` — confirms Feature 3 updates live from real data.
10. Confirmed RBAC: `conservation_officer` gets `403 Forbidden` on
    `/observations/upload-image` (matches the existing
    `CAN_INGEST` role set used for observation ingestion).
11. Regression-checked Milestone 1: `GET /datasets/` still returns all 5
    seeded datasets; `POST /surveys/` still creates a survey successfully.
12. `npm install && npm run build` — frontend builds cleanly (0 errors),
    `npm run dev` serves on `:5173`.

## Starting the app (unchanged commands)

```bash
# Backend
cd backend
pip install -r requirements.txt
python -m app.seed        # optional, re-runnable
uvicorn app.main:app --reload

# Frontend
cd frontend
npm install
npm run dev
```

First `/detect` call after a fresh install will pause briefly (a few
seconds) to download `yolov8n.pt` (~6.25MB) — this is normal and only
happens once per machine (cached under `~/.config/Ultralytics` /
wherever the working directory's `yolov8n.pt` lands).
