# Milestone 3 (Week 5 & 6) — Population Intelligence & Conservation

## What's implemented

### 6. Population Estimation Engine
- `POST /api/v1/population/assess/{site_id}?area_sq_km=<optional>` — computes
  per-species population size, density (if area given), growth rate vs the
  previous assessment, and a trend label (increasing/stable/declining/insufficient_data)
- `GET /api/v1/population/{site_id}/latest` — most recent estimate per species
- `GET /api/v1/population/{site_id}/history` — trend history, optionally filtered by species
- `GET /api/v1/population/distribution?species_common_name=<name>` — every site
  where a species has been observed, for map plotting (Species Distribution Mapping)
- Engine code: `backend/app/services/population_engine.py`

**Honest limitation**: this derives estimates from observation counts already
in the database (individual_count summed per species), which is a defensible
directional proxy but not a substitute for mark-recapture or distance-sampling
methodology. See the module docstring for details — this is documented
upfront, not discovered later.

### 8. Habitat Intelligence Engine
- `POST /api/v1/habitat/assess/{site_id}` — computes vegetation index proxy,
  degradation risk score, habitat suitability score, and an overall
  habitat_quality_score (which now feeds directly into the Biodiversity
  Intelligence Engine — see below)
- `GET /api/v1/habitat/{site_id}/latest`, `.../history`
- Engine code: `backend/app/services/habitat_engine.py`

**Honest limitation**: the original spec names Sentinel Hub / Google Earth
Engine as the intended real data source (satellite NDVI analysis). That
integration isn't built yet. This engine computes proxy scores from habitat
type + biodiversity trend as a documented placeholder with a clear
replacement path, not as validated remote-sensing analysis.

### 9. Conservation Recommendation Engine
- `POST /api/v1/conservation/generate/{site_id}` — reads the latest
  Biodiversity, Habitat, and Population assessments for a site and generates
  prioritized, auditable recommendations (each with a `rationale` field
  explaining which rule fired)
- `GET /api/v1/conservation/{site_id}` — list recommendations for a site
- `PATCH /api/v1/conservation/{recommendation_id}/status` — mark
  open/in_progress/resolved
- Engine code: `backend/app/services/conservation_engine.py`

Deliberately rule-based, not a trained ML model — conservation
recommendations get acted on by real staff, so explainability matters more
here than marginal accuracy gains from a black-box model.

### Integration between engines
The Habitat Intelligence Engine's `habitat_quality_score` now feeds directly
into the Biodiversity Intelligence Engine's weighted score (previously a
hardcoded 70.0 default in Milestone 2) — run a habitat assessment before a
biodiversity assessment for the most accurate score.

### Frontend
- `/population-habitat` — run/view population estimates and habitat assessments per site
- `/conservation` — generate and manage conservation recommendations per site

## Database schema additions (Milestone 3 tables)
- `population_estimates` (species, estimated size, density, growth rate, trend label)
- `habitat_assessments` (vegetation index, degradation risk, suitability, quality score)
- `conservation_recommendations` (priority, category, title, description, rationale, status)

## How to verify this milestone works
1. Complete Milestone 1 & 2 steps (site, survey, at least one image/audio upload).
2. Go to `/population-habitat`, select the site, click "Run Assessment" under
   both Population Estimates and Habitat Assessment.
3. Go to `/biodiversity` and run a new assessment — confirm the habitat
   quality score now reflects the real habitat assessment instead of the
   Milestone 2 default of 70.
4. Go to `/conservation`, click "Generate Recommendations" — confirm at
   least one recommendation appears with a clear rationale.

## Not yet implemented (Milestone 4 preview)
- GIS-based spatial visualization (Leaflet/Mapbox) of sites, observations, and recommendations
- PDF/Excel report export
- Production deployment hardening (Alembic migrations, CI/CD, PostgreSQL by default)
- Real satellite/NDVI integration for the Habitat Intelligence Engine
- Real IUCN Red List lookup for conservation_status (currently "unknown" for
  SpeciesNet/BirdNET detections — see Milestone 2 docs)
