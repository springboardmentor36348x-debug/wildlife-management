# Milestone 4 (Week 7 & 8) — Analytics, Testing & Deployment

## What's implemented

### GIS Visualization — Live Wildlife Monitoring Map
The headline feature of this milestone: a real-time map showing wildlife
sightings as they're detected, not a static snapshot.

- `GET /api/v1/live-map/snapshot?hours=24` — initial map load: every
  monitoring site with GPS coordinates plus its recent sightings
- `WS /api/v1/live-map/ws?token=<jwt>` — WebSocket feed pushing each new
  detection the moment it's analyzed, so the map updates without polling
- Wired into both upload endpoints (`images.py`, `audio.py`) via
  `app/services/live_feed.py` — every successful detection broadcasts to
  all connected clients
- Frontend: `/live-map` — React-Leaflet map (OpenStreetMap tiles, matching
  the original spec's tech stack) with a live sighting feed sidebar,
  connection status indicator, and a pulse animation on sites that just
  received a new sighting

**Honest limitation**: the WebSocket connection manager is in-memory and
single-process (see `live_feed.py` module docstring) — correct for this
project's single-instance deployment target, but would need a message
broker (Redis pub/sub, etc.) to fan out across multiple backend replicas in
a horizontally-scaled production deployment. That's a documented scope
boundary, not an oversight.

### Reports & Export System
- `GET /api/v1/reports/{site_id}/pdf` — formatted PDF report: biodiversity
  score, habitat assessment, population estimates, conservation
  recommendations
- `GET /api/v1/reports/{site_id}/excel` — multi-sheet Excel workbook
  (Species Observations, Population Estimates, Recommendations)
- Frontend: PDF/Excel download buttons on the Monitoring Sites page

### Production Deployment Hardening
- **Alembic migrations** set up (`backend/alembic/`) — reads `DATABASE_URL`
  from the app's own settings so there's one source of truth for the
  connection string. `Base.metadata.create_all()` still runs on startup for
  SQLite dev convenience; see the comment in `main.py` for the production
  migration path.
- **CI workflow** (`.github/workflows/ci.yml`) — runs backend tests and a
  frontend production build on every push/PR

## Not yet implemented / real limitations carried forward
- Real satellite/NDVI data for the Habitat Intelligence Engine (Milestone 3
  limitation, unchanged)
- IUCN Red List lookup for conservation_status on SpeciesNet/BirdNET
  detections (Milestone 2 limitation, unchanged)
- Multi-instance WebSocket fan-out (see Live Map limitation above)
- Automated frontend tests (CI currently only builds the frontend, doesn't
  run a test suite — none exists yet)

## How to verify this milestone works
1. Start the backend and frontend as usual.
2. Open two browser tabs: one on `/live-map`, one on `/upload`.
3. In the `/upload` tab, upload an image or audio file tied to a site with
   GPS coordinates.
4. Switch to the `/live-map` tab — the new detection should appear in the
   "Live Sighting Feed" sidebar and pulse on the map within a second or two,
   with no page refresh.
5. Go to `/monitoring-sites`, click "PDF" or "Excel" next to any site —
   confirm a formatted report downloads.
