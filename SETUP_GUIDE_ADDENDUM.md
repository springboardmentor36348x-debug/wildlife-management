# Setup Guide Addendum — New in this round (see MILESTONE4_FINAL_NOTES.md)

This is an addendum to `SETUP_GUIDE.md`, which still has the full base
setup (Python/Node prerequisites, backend venv, seeding, running each
service). Nothing there changed. This file only covers what's new.

---

## 1. Everything from SETUP_GUIDE.md still applies

Follow `SETUP_GUIDE.md` steps 0–5 exactly as written to get the backend
on `http://localhost:8000` and the frontend on `http://localhost:5173`
with `python -m venv` + `pip install -r requirements.txt` + `npm install`.
One thing to note: `backend/requirements.txt` now also includes
`reportlab`, `openpyxl` (PDF/Excel export) and `pytest`, `httpx` (testing)
— a plain `pip install -r requirements.txt` picks all of these up, no
extra step needed.

---

## 2. New pages to click around

Once logged in (any seeded demo account from `SETUP_GUIDE.md`), you'll
see four new items in the sidebar:

- **GIS Mapping** — a system-wide map of every monitoring site, with a
  layer filter by device type (Camera Trap / Drone / Audio Sensor /
  Satellite / Manual Survey). Click a marker or a site in the list on the
  right to see its details in the "GIS Inspector" panel.
- **Performance Metrics** — AI model precision/latency figures. Numbers
  labeled "Measured live" are real, timed on your running backend against
  your real data; numbers labeled "Configured target" are honest
  infra-sizing targets, not a live measurement (see the page's own
  "Honest Limitations" panel for exactly which is which and why).
- **Alerts** (also reachable via the bell icon in the top-right header) —
  endangered species, population decline, habitat degradation,
  monitoring device, and conservation alerts, generated live from your
  real survey/observation data. Click "Mark read" on any alert.
- **Reports** (existing page, now extended) — fill in the "Generate New
  Monitoring Report" form (pick a report type: Wildlife Survey, Species
  Population, Biodiversity, Habitat Assessment, or Conservation) and it
  appears in the "Generated Wildlife Reports Archive" table below with
  **PDF** and **Excel** download buttons.

If these pages look empty, run `python -m app.seed` from `backend/`
(safe to re-run) — it creates a demo survey, 5 GPS sites, and ~30
species-labeled observations, which is what the alerts, GIS map, and
report exports all read from.

---

## 3. Running the test suite

From the `backend/` folder, with your virtual environment activated and
`pip install -r requirements.txt` already run:

```bash
cd backend
pytest
```

This runs against an isolated **in-memory** SQLite database — it never
touches your real `wildlife.db` or any seeded data. You should see
something like:

```
======================== N passed in X.XXs ========================
```

covering health/root endpoints, register/login/role-based access,
survey & site creation, and the new notifications / performance /
reports-export endpoints (including actually downloading a generated
PDF and Excel file and checking their content type).

---

## 4. Running the whole stack with Docker Compose (new)

If you have Docker Desktop (or the Docker Engine + Compose plugin)
installed, you can now bring up **all three pieces** — PostgreSQL, the
FastAPI backend, and the React frontend (served by nginx) — with one
command from the project root (the folder containing `docker-compose.yml`):

```bash
docker compose up --build
```

First run will take a few minutes (it builds the backend image, which
includes PyTorch/TensorFlow for the YOLOv8/YAMNet pipelines, and the
frontend image). Once it's up:

- Frontend: **http://localhost:5173**
- Backend API docs: **http://localhost:8000/docs**

In a second terminal, seed demo data once:

```bash
docker compose exec backend python -m app.seed
```

To stop everything: `Ctrl+C`, then `docker compose down` (add `-v` to
also delete the Postgres volume and start fresh next time).

This is genuinely new — previously only `backend/Dockerfile` existed (for
building the backend image alone, per Step 7 of `SETUP_GUIDE.md`); this
compose file is what ties backend + frontend + a real Postgres database
together, which is what the project report's "Production deployment"
task under Milestone 4 asks for.

---

## Troubleshooting (new items only — see SETUP_GUIDE.md for the rest)

- **GIS Mapping page shows "No monitoring sites... for this layer"** →
  either no sites exist yet (run the seed script) or every site uses a
  device type you've filtered out — click "All".
- **Performance Metrics page shows "insufficient data" for AI accuracy
  figures** → those are computed from real `confidence_score` values on
  observations that went through actual detection (Image / Audio
  Detection page or seeded data) — upload/detect at least one image or
  audio clip, or run the seed script.
- **`pytest` fails to import `app`** → make sure you're running it from
  inside `backend/` (not the project root) with the venv active.
- **Docker Compose backend build is slow / times out** → the backend
  image installs PyTorch + TensorFlow, which is a large download; this is
  expected on first build and gets cached afterward.
