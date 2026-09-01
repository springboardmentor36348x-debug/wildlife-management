# Setup Guide — Running the Project in VS Code

This project has two parts that run independently and talk to each other over HTTP:

- **backend/** — FastAPI (Python) — serves the API on `http://localhost:8000`
- **frontend/** — React + Vite (JavaScript) — serves the UI on `http://localhost:5173`

You'll run each in its own VS Code terminal (split terminal or two terminal tabs).

---

## 0. Prerequisites

Install these once if you don't have them:

- **Python 3.11+** — https://www.python.org/downloads/
- **Node.js 20+** (includes npm) — https://nodejs.org/
- **VS Code** — https://code.visualstudio.com/
- Recommended VS Code extensions: *Python* (Microsoft), *ES7+ React snippets*, *Tailwind CSS IntelliSense*

You do **not** need PostgreSQL installed to try this out — the backend defaults to a local SQLite file (`wildlife.db`) so you can run it immediately. Postgres/PostGIS instructions are in Step 6 for when you're ready for the real database.

---

## 1. Open the project

Unzip the file, then in VS Code:
`File → Open Folder…` → select the unzipped `wildlife-intelligence-system` folder.

You'll see `backend/` and `frontend/` side by side.

---

## 2. Backend setup (FastAPI)

Open a terminal in VS Code (`` Ctrl+` `` / `` Cmd+` ``) and run:

```bash
cd backend

# Create and activate a virtual environment
python -m venv .venv

# Windows:
.venv\Scripts\activate
# macOS/Linux:
source .venv/bin/activate

# Install dependencies
pip install -r requirements.txt

# Create your local environment file
cp .env.example .env        # Windows: copy .env.example .env
```

`backend/.env` already defaults to SQLite (`wildlife.db`), so there's nothing else to
configure to get running. If you want real PostgreSQL/PostGIS instead, see Step 6.

### Seed demo data (creates one user per role + the 5 recommended datasets)

```bash
python -m app.seed
```

You'll see output confirming 4 demo users and 5 datasets were created, e.g.:
```
administrator          admin@wildlife.org           Admin@12345
researcher             researcher@wildlife.org      Research@12345
conservation_officer   officer@wildlife.org         Officer@12345
forest_department      forest@wildlife.org          Forest@12345
```

### Run the API server

```bash
uvicorn app.main:app --reload --port 8000
```

Leave this terminal running. Visit **http://localhost:8000/docs** — you should see the interactive Swagger API docs with all endpoints (auth, users, surveys, observations, datasets).

---

## 3. Frontend setup (React)

Open a **second** VS Code terminal (click the `+` in the terminal panel) and run:

```bash
cd frontend
npm install
cp .env.example .env        # Windows: copy .env.example .env
npm run dev
```

Vite will print a local URL, normally **http://localhost:5173**. Open it in your browser.

---

## 4. Log in

On the login screen, use any of the seeded demo accounts, for example:

| Role | Email | Password |
|---|---|---|
| Administrator | admin@wildlife.org | Admin@12345 |
| Researcher | researcher@wildlife.org | Research@12345 |
| Conservation Officer | officer@wildlife.org | Officer@12345 |
| Forest Department | forest@wildlife.org | Forest@12345 |

Try logging in as different roles to see how the sidebar navigation and permissions change — for example, only Administrators see **User Management**, and only Administrators/Researchers/Forest Department can create surveys and sites (Conservation Officers have read-only access, matching the RBAC rules in the spec).

---

## 5. What to click around

- **Overview** — role-specific dashboard with live counts pulled from the API
- **Surveys & Sites** — create a survey, then register a monitoring site (camera trap / drone / audio sensor) with GPS coordinates against it
- **Dataset Pipeline** — the 5 seeded datasets (Snapshot Serengeti, iNaturalist, BirdCLEF, GBIF, Animal Kingdom) plus the ability to register new ones. **Click a dataset row to expand it**, then use "Upload sample files" to attach real images/audio — these are actually stored on disk (`backend/uploads/datasets/<id>/`) and served back with thumbnails/audio players, not just a metadata count.
- **Reports** — a live feed of every observation and dataset file you've created, with real summary stats at the top (not hardcoded placeholders)
- **User Management** (Admin only) — view all accounts and deactivate one

Everything you do in the UI is a real API call — check the `backend` terminal to see the request logs, or visit `/docs` to call the same endpoints directly.

---

## 6. (Optional) Switching to real PostgreSQL + PostGIS

The schema is written to work identically on SQLite (for quick local dev) or PostgreSQL (production-shaped, with room to add PostGIS geometry columns in Milestone 4). To switch:

1. Install PostgreSQL locally, or run it via Docker:
   ```bash
   docker run --name wildlife-postgres -e POSTGRES_USER=wildlife_user \
     -e POSTGRES_PASSWORD=wildlife_pass -e POSTGRES_DB=wildlife_db \
     -p 5432:5432 -d postgres:16
   ```
2. In `backend/.env`, set:
   ```
   DATABASE_URL=postgresql+psycopg2://wildlife_user:wildlife_pass@localhost:5432/wildlife_db
   ```
3. Delete `backend/wildlife.db` if it exists, restart the backend (`uvicorn` recreates tables on startup), and re-run `python -m app.seed`.

---

## 7. (Optional) Running with Docker instead of manual setup

A `Dockerfile` is included for the backend. If you have Docker installed:

```bash
cd backend
docker build -t wildlife-backend .
docker run -p 8000:8000 --env-file .env wildlife-backend
```

(A `docker-compose.yml` tying backend + Postgres + frontend together is a natural next step for Milestone 5's "Docker containerization" task — not required to run Milestone 1 locally.)

---

## Troubleshooting

- **"Connection refused" in the frontend / network errors on login** → make sure the backend terminal shows `Uvicorn running on http://0.0.0.0:8000` and that `frontend/.env`'s `VITE_API_BASE_URL` matches.
- **CORS errors in the browser console** → check `backend/.env`'s `CORS_ORIGINS` includes the exact URL Vite printed (default already includes `http://localhost:5173`).
- **`bcrypt` / `passlib` version errors** → the pinned `bcrypt==4.0.1` in `requirements.txt` avoids a known incompatibility with newer bcrypt releases; make sure your venv installed exactly that version (`pip show bcrypt`).
- **Port already in use** → change `--port 8000` to another port for uvicorn, and update `VITE_API_BASE_URL` accordingly (and vice versa for Vite's `--port`).
