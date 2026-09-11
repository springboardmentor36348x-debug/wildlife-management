# Milestone 3 & 4 — What Was Missing, and What Changed

You said Milestones 1–4 were "complete" per the project report, but Milestone
3 & 4 had no visible working output when you ran the project. Here's exactly
what was going on, and exactly what was changed to fix it. **Nothing in
Milestone 1 or 2 was touched.**

## What was already there (before this change)

The backend was actually in good shape:
- `backend/app/api/routes/population.py`, `habitat.py`, `conservation.py`,
  `health.py` — all real, working FastAPI endpoints implementing Milestone
  3's Features B–E (Population Estimation, Habitat Intelligence,
  Conservation Recommendations, Ecosystem Health Scoring).
- `backend/app/services/*.py` — the real logic behind each of those, with
  detailed docstrings about what's real data vs. an honest proxy (see
  `MILESTONE3_NOTES.md` for the full writeup — worth reading, it's honest
  about the exact limitations of each engine, e.g. "density" here is
  observations-per-site, not true animals/km², because there's no site
  boundary polygon to divide by).
- `frontend/src/api/client.js` — every one of those endpoints was already
  wrapped as a JS function (`getPopulationCounts`, `getHealthScoreAllSites`,
  etc.) ready to call.

## What was actually missing (this is why it looked broken)

1. **No dedicated frontend pages.** All of the Milestone 3 data was only
   ever wired into small, role-specific sections buried inside the one
   Dashboard page (`DashboardPage.jsx`). There was no Population page, no
   Habitat page, no Conservation page, and no Ecosystem Health page — the
   sidebar didn't even list them. The sidebar footer still literally said
   *"Milestone 2 · Species Recognition & Biodiversity Analysis"*.
2. **No GIS map anywhere.** The spec and your reference video both show a
   real map with markers (Milestone 4's "GIS visualization module"). Leaflet
   was never installed or used.
3. **The seed script created zero sample data for any of this.** It only
   created 4 demo user logins and 5 dataset registry rows — no surveys, no
   monitoring sites, no observations. Even with pages built, everything
   would load and show "no data yet" until you manually created a survey,
   registered a GPS site, and ran real image/audio detections yourself.
   That's very likely what made Milestone 3 & 4 look "not working."

## What was changed

**Frontend — 4 new pages, wired to the existing (already-working) backend:**
- `frontend/src/pages/PopulationPage.jsx` → route `/population`
  Population counting (bar chart), density-per-site, species distribution
  per site, a trend chart for a chosen species, and the migration/movement
  proxy.
- `frontend/src/pages/HabitatPage.jsx` → route `/habitat`
  A real Leaflet map (OpenStreetMap tiles) plotting every monitoring site
  by its real GPS coordinates — click a marker or a site in the side list
  to see habitat classification, degradation detection, vegetation/
  environmental status, and habitat-suitability scoring for that site.
- `frontend/src/pages/ConservationPage.jsx` → route `/conservation`
  Conservation priority ranking for every site, restoration suggestions,
  protection strategies, monitoring optimization, and resource-allocation
  recommendations.
- `frontend/src/pages/EcosystemHealthPage.jsx` → route `/ecosystem-health`
  Every site ranked worst-to-best by the spec's exact weighted formula
  (Species Diversity 30% + Population Stability 25% + Habitat Quality 20%
  + Endangered Species Status 15% + Environmental Conditions 10%), with a
  full component-by-component breakdown when you click a site.

**Frontend — routing & navigation:**
- `frontend/src/App.jsx` — added routes for all 4 pages above.
- `frontend/src/components/Layout.jsx` — added sidebar links for all 4
  pages, and updated the footer label from "Milestone 2" to
  "Milestone 3 & 4".

**Frontend — map dependency:**
- `frontend/package.json` — added `leaflet` and `react-leaflet`. The map
  uses a hand-drawn inline SVG marker icon (not the Leaflet default PNG
  icon), which sidesteps a very common Leaflet+Vite bug where the default
  marker icon fails to load — so this should work out of the box.

**Backend — sample data so the new pages aren't empty on first run:**
- `backend/app/seed.py` — now also creates one demo Survey ("Serengeti-Mara
  Ecosystem Watch"), 5 monitoring sites with real GPS coordinates and mixed
  habitat types, and ~30 species-labeled observations spread over the last
  60 days. One site is deliberately left sparse and one species
  ("leopard") is deliberately kept rare, so Conservation Priorities and
  Ecosystem Health show a realistic spread (some sites Excellent, some
  Vulnerable) instead of everything looking the same.
  **Important:** these seeded observations are inserted directly into the
  database — they do **not** go through the real YOLOv8/YAMNet detection
  pipeline. They exist purely so the analytics pages have something to
  compute from immediately. Your own image/audio uploads through
  **Image / Audio Detection** still go through the real pipeline exactly
  as before — that part of Milestone 2 was not touched.

## How to run it

Same setup as before (see `SETUP_GUIDE.md`), with one extra `npm install`
because of the new Leaflet dependency:

```bash
# Backend (unchanged)
cd backend
python -m venv .venv && source .venv/bin/activate   # Windows: .venv\Scripts\activate
pip install -r requirements.txt
cp .env.example .env
python -m app.seed          # safe to re-run — adds the new demo survey/sites/observations
                             # even if you already ran seed before
uvicorn app.main:app --reload --port 8000

# Frontend (new: npm install picks up leaflet + react-leaflet)
cd frontend
npm install
cp .env.example .env
npm run dev
```

Log in with any seeded account (see `SETUP_GUIDE.md` for the full list),
then click **Population**, **Habitat (Map)**, **Conservation**, or
**Ecosystem Health** in the sidebar — each should show real, populated data
immediately, no manual data entry required.

## What each Milestone 3 & 4 page actually demonstrates

- **Population** — proves Feature B (Population Estimation Engine): live
  counts, a relative density proxy, a time-bucketed trend chart, and a
  "which sites has this species been seen at, in order" migration proxy.
- **Habitat (Map)** — proves Feature C (Habitat Intelligence Engine) *and*
  Milestone 4's GIS visualization requirement: real markers on a real map,
  plus per-site degradation/suitability analysis. Vegetation and
  environmental-condition analysis honestly report "not available" rather
  than making up numbers, because no satellite/NDVI or weather sensor feed
  is connected — this is called out in `MILESTONE3_NOTES.md`.
- **Conservation** — proves Feature D (Conservation Recommendation
  Engine): rule-based (not ML — there's no historical outcome data to
  train a model on) priority ranking, restoration suggestions, protection
  strategies, and resource allocation, every one traceable to a concrete
  `if` rule in `conservation_service.py`.
- **Ecosystem Health** — proves Feature E (Wildlife Health Scoring
  Engine): the exact weighted formula from the project report, computed
  live, with a full breakdown of why each site scored what it did.

## What's intentionally still out of scope

Per the existing `backend/app/api/routes/reports.py` docstring, PDF/Excel
**export** was already flagged as a later-milestone deliverable and wasn't
added here — the Reports page still shows live summary stats and a records
feed, just not a downloadable file yet. Real satellite/NDVI vegetation
data, real environmental sensor feeds, real IUCN Red List endangered-status
data, and real individual-animal migration tracking are all genuine data
sources the spec calls for that nothing in this codebase claims to have —
see the "what to do differently in production" table at the end of
`MILESTONE3_NOTES.md` for the complete, honest list.
