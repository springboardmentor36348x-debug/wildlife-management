# Wildlife Population Intelligence System — Milestone 1

AI-Powered Wildlife Population Intelligence System: automated species identification,
population estimation, habitat health assessment, and threat detection.

This package contains the Milestone 1 deliverable: project initialization, requirement
analysis, RBAC, core database schema, and survey/monitoring-site/dataset management —
built as a working FastAPI backend + React frontend (not just a spec document).

See `SETUP_GUIDE.md` for full run instructions in VS Code.

## Structure
```
wildlife-intelligence-system/
├── backend/     FastAPI + SQLAlchemy + JWT auth (Python)
├── frontend/    React + Vite + Tailwind (JavaScript)
├── docs/        Original requirements & SDLC documents
└── SETUP_GUIDE.md
```

## Roles supported
- Administrator
- Wildlife Researcher
- Conservation Officer
- Forest Department

## Demo credentials (after running the seed script)
| Role | Email | Password |
|---|---|---|
| Administrator | admin@wildlife.org | Admin@12345 |
| Researcher | researcher@wildlife.org | Research@12345 |
| Conservation Officer | officer@wildlife.org | Officer@12345 |
| Forest Department | forest@wildlife.org | Forest@12345 |

## What's implemented (Milestone 1)
- JWT authentication (access + **refresh tokens** — stay logged in without re-entering your password every 60 minutes) + bcrypt password hashing
- Role-based access control across 4 roles
- Survey & multi-zone monitoring site management (GPS, habitat type, device type)
- Multi-modal observation ingestion contract (image/audio/telemetry)
- Dataset registry (Snapshot Serengeti, iNaturalist, BirdCLEF, GBIF, Animal Kingdom)
  with **real file upload** — attach actual sample images/audio to a dataset, viewable
  and downloadable via the app (not just metadata)
- **Reports page** — a live "module records" feed and summary stats (Images Analyzed,
  Audio Clips, Species Confirmed, Surveys, Sites) computed from real database rows
- Role-tailored dashboards (Admin, Researcher, Officer, Forest Department)

## What's intentionally out of scope here (future milestones per the roadmap)
- Milestone 2: dataset cleaning/preprocessing automation
- Milestone 3: YOLOv8 / BirdNET model training & inference
- Milestone 4: PostGIS geospatial analytics, biodiversity/ecosystem health engine
- Milestone 5: full polish, GIS map view, PDF/Excel export, production deployment
