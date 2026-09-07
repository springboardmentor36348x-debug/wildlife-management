# Wildlife Population Intelligence System

An AI-powered platform for wildlife species identification, bioacoustic
recognition, population estimation, and biodiversity analytics.

## Status

- **Milestone 1** (project init, auth, survey/monitoring management) — complete
- **Milestone 2** (species recognition & biodiversity analysis) — complete
- **Milestone 3** (population intelligence, habitat intelligence, conservation recommendations) — complete
- **Milestone 4** (live GIS map, report export, production deployment hardening) — complete

See `docs/MILESTONE_1.md` through `docs/MILESTONE_4.md` for details.

## Architecture highlights

- **Image species ID**: SpeciesNet (Google) + MegaDetector (Microsoft) —
  pretrained, 2000+ species worldwide, no training required. Falls back to
  YOLOv8 (custom-finetuned, then stock COCO) if not installed.
- **Audio species ID**: BirdNET — pretrained, 6,522 bird species globally,
  no training required. Falls back to a placeholder classifier for non-bird
  sounds (no equivalent mature global model exists for those yet).
- **Live GIS map**: WebSocket-pushed real-time sightings on an interactive
  map (`/live-map`) — no polling. See `app/services/live_feed.py`.
- See `app/services/image_analysis.py` and `app/services/bioacoustic_engine.py`
  module docstrings for the full tiered fallback strategy.

## 1. Project Structure

```
wildlife-population-intelligence-system/
├── backend/                  # FastAPI + SQLite/PostgreSQL backend
│   ├── app/
│   │   ├── main.py
│   │   ├── config.py
│   │   ├── database.py
│   │   ├── db_types.py       # portable UUID type (SQLite + Postgres)
│   │   ├── models/
│   │   ├── schemas/
│   │   ├── auth/
│   │   ├── routers/
│   │   └── services/          # image_analysis.py, bioacoustic_engine.py, biodiversity_engine.py
│   ├── training/               # optional YOLOv8 fine-tuning pipeline (see its README)
│   ├── uploads/
│   ├── tests/
│   ├── requirements.txt
│   └── .env.example
├── frontend/                   # React + Vite + Tailwind frontend
│   └── src/
│       ├── api/
│       ├── context/
│       ├── components/
│       ├── pages/
│       └── App.jsx / main.jsx
├── docs/
├── docker-compose.yml
└── README.md
```

## 2. Prerequisites

- Python 3.11+
- Node.js 18+ and npm
- Docker & Docker Compose (optional — SQLite works without it)

## 3. Quick Start (SQLite, no Docker, no Postgres)

### Backend
```bash
cd backend
python -m venv venv
source venv/bin/activate        # Windows: venv\Scripts\activate

pip install -r requirements.txt

cp .env.example .env
# .env already defaults to SQLite — no edits needed

uvicorn app.main:app --reload
# -> http://localhost:8000/docs
```

### Frontend
```bash
cd frontend
npm install
cp .env.example .env
npm run dev
# -> http://localhost:5173
```

## 4. First-Time Walkthrough

1. Register an account, log in.
2. **Monitoring Sites** → register a site (name, GPS, habitat type).
3. **Surveys** → log a survey tied to that site.
4. **Upload Image/Audio** → upload a photo or audio clip. Detections appear
   automatically via SpeciesNet/BirdNET (or fallback tiers).
5. **Species Observations** → aggregated species + endangered alerts.
6. **Biodiversity Analytics** → run a weighted ecosystem health assessment.

## 5. Switching to PostgreSQL later

1. Install PostgreSQL, create a database.
2. Uncomment `psycopg2-binary` in `requirements.txt`, reinstall.
3. Edit `DATABASE_URL` in `.env`.
4. Restart the backend — no code changes needed (portable UUID type already
   supports both databases).
