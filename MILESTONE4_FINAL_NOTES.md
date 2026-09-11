# Milestone 4 — Final Completion Notes

`MILESTONE4_CHANGES.md` (already in this project) documents the first
round of Milestone 3 & 4 work: the Population/Habitat/Conservation/
Ecosystem Health pages and their seed data. **This file documents a
second round that completes everything the project report's Milestone 4
section still called for after that first round**, and it does so
without touching any file described in `MILESTONE4_CHANGES.md` or
earlier milestone docs.

Cross-checked directly against the project report:
- Section 8 — Performance Metrics
- Section 11 — Dashboard & Analytics (GIS visualization)
- Section 12 — Notification & Alert System
- Section 13 — Reports & Export System (PDF export, Excel export)
- Section 14 — Final Integration, Testing & Deployment

## What was added

### 1. Notification & Alert System (FR-12)
- `backend/app/models/notification.py`, `backend/app/services/notification_service.py`,
  `backend/app/api/routes/notifications.py`.
- Generates all five alert types the report lists — Endangered Species,
  Population Decline, Habitat Degradation, Monitoring Device, and
  Conservation notifications — by **re-running the exact same real-data
  logic that already powers the Population/Habitat/Conservation pages**
  (`conservation_service`'s rare-species proxy, `habitat_service`'s
  degradation proxy, and a new "no observations in 30 days" stale-site
  proxy for device health). Nothing here invents a number; every rule is
  documented in `notification_service.py`'s docstring.
- Alerts persist in a `notifications` table so read/unread state survives
  a page refresh, keyed by a deterministic fingerprint so re-scanning
  never duplicates an alert or loses its read state.
- Frontend: `frontend/src/pages/NotificationsPage.jsx` (full alert list,
  filterable by type, mark-as-read) + `frontend/src/components/NotificationBell.jsx`
  (header dropdown with an unread-count badge, polling every 60s).

### 2. Performance Metrics (FR-8)
- `backend/app/services/performance_service.py`, `backend/app/api/routes/performance.py`.
- Every number returned is labeled `is_measured: true/false` so the UI
  never presents a benchmark as if it were a live measurement:
  - **Measured live:** image inference latency (real timing of the actual
    YOLOv8 `detect_animals()` call — see the small addition to
    `vision_service.py`), audio preprocessing latency (real local
    librosa load+resample timing — see `audio_service.py`), API response
    time (a real DB round trip timed on the request itself), and Species
    Detection Precision / Bioacoustic Call Accuracy (the real average
    `confidence_score` of your actual stored observations).
  - **Configured target, not measured:** Concurrent Monitoring Capacity
    and the `<200ms` latency target — genuinely can't be load-tested
    inside this sandbox, so they're returned as a labeled target instead
    of a fabricated "measured" number.
- Frontend: `frontend/src/pages/PerformancePage.jsx`.

### 3. Reports & Export System (FR-13) — wiring the export engine that already existed
- `backend/app/services/export_service.py` (PDF via reportlab, Excel via
  openpyxl) was already present in the codebase from earlier work but was
  **never connected to a route or the UI** — dead code. This round:
  - Added `GET /reports/types`, `POST /reports/generate`,
    `GET /reports/generated`, `GET /reports/export/{report_id}`, and
    `GET /reports/export-type/{report_type}` to `backend/app/api/routes/reports.py`.
  - Added `backend/app/models/report_log.py` (`GeneratedReport`) — a
    metadata-only log of each "Generate Report" click (title, type,
    author, a short auto-summary). The downloadable file itself is
    **always rebuilt live** from the current database at download time
    (never stored), so a download can never go stale relative to what's
    on screen — same guarantee `export_service.py`'s own docstring
    already promised.
  - Frontend: `ReportsPage.jsx` gained a "Generate New Monitoring Report"
    form and a "Generated Wildlife Reports Archive" table with PDF/Excel
    download buttons per row.

### 4. GIS Mapping (report section 11's "GIS visualization" requirement, as its own module)
- `frontend/src/pages/GISMappingPage.jsx` — a dedicated, system-wide map
  (Leaflet + OpenStreetMap, same library `HabitatPage.jsx` already used)
  showing **every** registered monitoring site regardless of survey, with
  a layer filter by device type (Camera Trap / Drone / Audio Sensor /
  Satellite / Manual Survey — the real `MonitoringDevice` enum, not
  fabricated categories) and a "GIS Inspector" side panel with the
  selected site's real coordinates, habitat type, and protected area.
  This is separate from `HabitatPage.jsx`'s map, which stays focused on
  per-site habitat analysis.

### 5. Final Integration, Testing & Deployment (FR-14)
- **Tests:** `backend/tests/` (`conftest.py`, `test_health.py`,
  `test_auth.py`, `test_reports_and_metrics.py`) using pytest +
  FastAPI's `TestClient` against an isolated in-memory SQLite database —
  running the suite never touches your local `wildlife.db`. Covers
  health/root endpoints, register/login/RBAC, survey+site creation, and
  the new notifications/performance/reports-export endpoints end to end
  (including actually downloading a generated PDF and Excel file and
  checking their content-type).
- **Docker Compose:** `docker-compose.yml` (new, at the project root) —
  the "next step" `SETUP_GUIDE.md` already flagged. Brings up Postgres +
  the FastAPI backend + the React frontend (via a new
  `frontend/Dockerfile` + `frontend/nginx.conf`) together with one
  command. The backend's existing `Dockerfile` was not changed.

## What's still honestly out of scope

Everything already flagged as out of scope in `MILESTONE3_NOTES.md` and
`MILESTONE4_CHANGES.md` remains out of scope here too: real satellite/NDVI
vegetation data, real environmental sensor feeds, real IUCN Red List
endangered-status data, real individual-animal migration tracking, and a
real hardware device-heartbeat channel (the "Monitoring Device" alert
above is an honest last-seen-timestamp proxy, not real telemetry). A
genuine concurrent-load benchmark also isn't run here — see the
Performance Metrics page's "Honest Limitations" panel for the full,
current list.

## How to run everything, including the new pieces

See `SETUP_GUIDE.md` for the base setup (unchanged) and
`SETUP_GUIDE_ADDENDUM.md` (new, in this same folder) for: running the
test suite, using Docker Compose for the full stack, and a tour of the
four new pages (GIS Mapping, Performance Metrics, Alerts, and the
enhanced Reports page).
