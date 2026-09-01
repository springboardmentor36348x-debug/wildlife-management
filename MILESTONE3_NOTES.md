# Milestone 3 Notes — Population Intelligence & Conservation

This covers Features A–F built on top of Milestones 1 & 2: Bioacoustic
Recognition, Population Estimation, Habitat Intelligence, Conservation
Recommendations, Ecosystem Health Scoring, and the role-based dashboards
that surface all of it.

Every test result quoted below is real output from actually running the
server and hitting the endpoints with curl during development — nothing
here is a description of what the code "should" do.

---

## Feature A — Bioacoustic Recognition Engine (YAMNet)

### Model used, and why

`google/yamnet/1` via `tensorflow_hub`, inference only — no training.
YAMNet is a general-purpose audio event classifier trained on the 521-class
AudioSet ontology, which already covers everything the spec's "Audio
Features" list asks for (bird calls, mammal vocalizations, amphibian
calls, insect sounds) as AudioSet class labels, with zero additional
training needed.

### AudioSet → category mapping

`ANIMAL_CLASS_CATEGORY` in `audio_service.py` hardcodes the subset of
YAMNet's 521 AudioSet classes that represent real animal sounds, mapped to
four categories:

| Category | Example AudioSet classes |
|---|---|
| `bird_call` | Bird, Bird vocalization/call/song, Chirp/tweet, Crow, Owl, Gull, Pigeon/dove |
| `mammal_vocalization` | Roar, Growling, Bark, Howl, Moo, Elephant, Oink, Bleat, Meow, Purr, Hiss, Wild animals, Livestock |
| `amphibian_call` | Frog, Croak |
| `insect_sound` | Insect, Cricket, Mosquito, Buzz, Bee/wasp |

Everything else in AudioSet (Speech, Music, Vehicle, Door, etc.) is
filtered out before it can reach the response.

### Environmental noise filtering

Any prediction under `CONFIDENCE_THRESHOLD = 0.15` is discarded rather
than forced into the top slot — with 521 possible classes (uniform chance
~0.002), 0.15 is a conservative floor that drops noise-driven low-
confidence guesses while still surfacing genuine-but-quiet animal sounds.
This is a starting point, not a tuned value — it has never been validated
against real labeled wildlife audio (see sandbox limitation below).

### ⚠️ Sandbox network limitation (real, reproduced)

`tensorflow_hub.load()` downloads YAMNet's weights on first use from
`https://tfhub.dev/google/yamnet/1`. The development sandbox this was
built in only allows outbound HTTPS to a fixed allowlist of package
registries (PyPI, npm, GitHub, crates.io, apt) — **not** `tfhub.dev` or
`storage.googleapis.com`. Running the actual code in that sandbox
reproduces:

```
>>> import tensorflow_hub as hub
>>> hub.load('https://tfhub.dev/google/yamnet/1')
urllib.error.HTTPError: HTTP Error 403: Forbidden
```

This is a sandbox network policy limitation, not a bug in the code. **On
your own machine, with normal internet access, this downloads the ~15MB
model once (cached under `~/.cache/tfhub_modules/`) and works exactly as
written.** The endpoint is built to fail honestly if the model can't load
— it raises a 502 with the real error message rather than fabricating a
detection result (see test evidence below).

### A real bug we found and fixed along the way

While testing, calling YOLOv8's `.predict()` (Milestone 2, PyTorch) in the
same process as an imported `tensorflow_hub` (Milestone 3 Feature A)
**segfaulted the worker** on this sandbox's CPU build:

```
[  215.167773] python3[708]: segfault at 4fb62f46 ip ... in libtriton.so
```

Isolated and confirmed the exact trigger:
- `import tensorflow_hub` → `import ultralytics; YOLO(...).predict(...)` → **segfault**
- `import ultralytics; YOLO(...).predict(...)` → `import tensorflow_hub` → predict again → **works fine**

Order matters: TensorFlow's native libs loaded *before* PyTorch/Triton's
first inference corrupts something Triton depends on. The fix, applied in
this codebase:
1. `audio_service.py` imports `tensorflow_hub` **lazily**, inside
   `_get_model()`, not at module top — so importing `observations.py`
   (and therefore the whole app) no longer pulls TensorFlow into the
   process just by starting up.
2. `main.py`'s startup event now runs one dummy YOLO prediction (on a
   throwaway blank image) *before* anything else, guaranteeing YOLO
   always gets its first inference in before TensorFlow could ever be
   imported later by a real `/detect-sound` request.

This is a real, deployment-environment-specific finding — it may or may
not reproduce on your machine/CI (it's tied to this sandbox's specific
CPU/Triton build), but the lazy-import + warm-up fix is a safe, generally
good pattern regardless, and it's what let both pipelines run reliably
side-by-side here.

### Real test evidence (from this session)

**Plumbing test — SYNTHETIC audio (a generated 800Hz tone + noise, 3s,
clearly NOT a real animal call, used only to exercise the upload → detect
pipeline end to end):**

```
POST /observations/upload-audio  -> 201 Created
{"id":"953f88c5-...","observation_type":"audio",
 "file_reference":"/uploads/observations/953f88c5-.../....wav",
 "species_label":null,"confidence_score":null}

POST /observations/953f88c5-.../detect-sound  -> 502 Bad Gateway
{"detail":"YAMNet model could not be loaded (pretrained weights fetch
 failed): HTTP Error 403: Forbidden"}

GET /observations/953f88c5-...  (after the failed call)
{"species_label":null,"confidence_score":null, ...}
```

`species_label` stayed `null` — the endpoint did not fabricate a result
when the model couldn't load. This is the correct, honest behavior.

**No real wildlife audio files were available in this environment**, so a
true classification result (e.g. "this is a bird_call at 0.62 confidence")
was never produced or claimed. **You should re-run this exact test on
your own machine** with a real audio clip once you pull this code — on a
machine with normal internet access, `/detect-sound` will download YAMNet
once and return real classifications.

---

## Feature B — Population Estimation Engine

All functions in `population_service.py` operate on real `Observation`
rows (species_label populated by the image or audio pipeline). No rows or
numbers are fabricated anywhere.

**Density proxy:** `get_population_density` returns count-per-site, which
is a *relative* density proxy, **not** true animals/km². `MonitoringSite`
only stores a point (lat/lon), not a boundary/catchment-area polygon, so
a true density calculation isn't possible with the data we have. Real
fix: add a site boundary geometry (e.g. a PostGIS polygon) to divide by.

**Migration proxy:** `get_species_site_movement` lists which sites a
species has been seen at, in chronological order — it is explicitly
**not** individual-animal tracking. We can't tell whether the same
physical animal moved between sites or different individuals were
independently observed at each. Real fix: individually tagged/
re-identified animals (RFID collars, photo-ID re-matching).

**Trend data:** `get_population_trend` buckets by day. With only a few
hours of test data, most trends will show as flat or sparse — that's
correct behavior, not a bug; the code was never asked to fabricate
historical rows to fake a trend, and it doesn't.

### Real test evidence (5 real Observation rows across 2 sites, 3 species)

```
GET /population/counts
[{"species":"elephant","count":6},{"species":"bird","count":4},
 {"species":"giraffe","count":3},{"species":"frog","count":3},
 {"species":"zebra","count":2},{"species":"leopard","count":1}]

GET /population/density?survey_id=<id>
[{"site_id":"94ac...","site_name":"Site Alpha","species":"bird","count":1},
 {"site_id":"94ac...","site_name":"Site Alpha","species":"elephant","count":2},
 {"site_id":"3e95...","site_name":"Site Beta (Wetland)","species":"bird","count":1},
 {"site_id":"3e95...","site_name":"Site Beta (Wetland)","species":"frog","count":1}]

GET /population/trend?species=elephant&window_days=60
[{"date":"2026-07-13","count":1},{"date":"2026-08-01","count":1},
 {"date":"2026-08-10","count":1},{"date":"2026-08-12","count":1},
 {"date":"2026-08-20","count":1}]

GET /population/movement?species=bird
[{"site_name":"Site Beta (Wetland)","first_observed_at":"2026-08-05 08:00:00","observation_count":1},
 {"site_name":"Site Alpha","first_observed_at":"2026-08-15 08:00:00","observation_count":1}, ...]
```

---

## Feature C — Habitat Intelligence Engine

No real satellite imagery, NDVI feed, or environmental sensor is
connected. `habitat_service.py` is explicit about what's real vs. proxy:

- `classify_habitat` — **real data**, not a proxy (returns the site's
  actual registered `habitat_type`).
- `detect_habitat_degradation` — **proxy**. Compares species-observation
  count in a recent window vs. an equal prior window; >30% drop = flagged
  "declining". Real fix: an NDVI satellite time series (Sentinel-2 /
  Landsat via Google Earth Engine).
- `analyze_vegetation` / `monitor_environmental_conditions` — **honestly
  return `"status": "not_available"`**, no fabricated numbers.
- `predict_habitat_suitability` — **proxy**. Combines a small
  habitat/species compatibility lookup table with real cross-site
  observation evidence.

### Real test evidence

```
GET /habitat/sites/<id>/degradation
{"status":"stable","recent_count":3,"previous_count":0,"change_pct":null}

GET /habitat/sites/<id>/vegetation
{"status":"not_available","reason":"No satellite/NDVI vegetation data
 source is connected. Would require integrating Sentinel Hub, Google
 Earth Engine, or NASA EarthData for this site's coordinates."}

GET /habitat/sites/<id>/environmental
{"status":"not_available","reason":"No environmental sensor
 (temperature/humidity/rainfall) feed is connected for this site..."}

GET /habitat/sites/<id>/suitability?species=elephant   (forest site)
{"suitability_score":60,"reasoning":"'elephant' is on the compatibility
 list for habitat_type 'forest' (+50). Observed at 1 other real 'forest'
 site(s) in this system (+10, capped at 50)."}
```

---

## Feature D — Conservation Recommendation Engine

Rule-based, not ML — a real ML recommendation model would need historical
conservation-outcome training data ("site X got intervention Y, recovered
by Z%") that doesn't exist. Every recommendation is a templated string
chosen by an inspectable rule in `conservation_service.py`.

`RARE_SPECIES_OBSERVATION_THRESHOLD = 2`: a species is treated as
"rare/vulnerable" if it has ≤2 total observations system-wide. This is a
naive proxy for real IUCN Red List data, which is not connected.

### Real test evidence

```
GET /conservation/priorities
[{"site_name":"Site Beta (Wetland)","priority":"medium",
  "reasoning":"No species recorded at this site yet. Not enough
   observation history yet to assess habitat trend."}, ...]

GET /conservation/monitoring-optimization
[{"site_name":"Site Alpha","suggestion":"Well-monitored relative to
  other sites - consider reallocating a sensor elsewhere."},
 {"site_name":"Site Wetland C","suggestion":"Low observation volume
  relative to other sites - consider adding more monitoring devices."}]
```

---

## Feature E — Ecosystem Health Scoring Engine

Implements the spec's exact weighted formula in `health_score_service.py`:

```
Ecosystem Health Score =
    Species Diversity Score         x 0.30
  + Population Stability Score      x 0.25
  + Habitat Quality Score           x 0.20
  + Endangered Species Status Score x 0.15
  + Environmental Conditions Score  x 0.10
```

**`conservation_status` thresholds** (the spec names the 5 labels but not
exact cutoffs — defined here):

| Score | Label |
|---|---|
| 80+ | Excellent |
| 65–79 | Healthy |
| 50–64 | Moderate Concern |
| 35–49 | Vulnerable |
| <35 | Critical |

**Endangered Species Status Score — direction, called out explicitly per
the spec's warning:** MORE rare-species-presence at a site LOWERS this
score (higher risk = lower "status" score) — the opposite of Species
Diversity, where more distinct species is better.

**Environmental Conditions Score:** always defaults to a neutral 50 with
an explicit note, since Feature C already marked real environmental data
`"not_available"`. Never fabricated.

**Population Stability Score:** defaults to neutral 50, with a note, when
there isn't enough trend data to call a direction — the common case with
a freshly seeded test system.

### Real test evidence

```
GET /health/score?site_id=<Site Alpha>
{
  "components": {
    "species_diversity": {"score":67,"note":"2 distinct species observed
      here, vs 3 at the most diverse site in the system.","weight":0.3},
    "population_stability": {"score":70,"note":"Averaged trend-derived
      stability across 2 species with recorded activity.","weight":0.25},
    "habitat_quality": {"score":85,"note":"Averaged habitat-degradation
      proxy across 1 site(s).","weight":0.2},
    "endangered_species_status": {"score":100,"note":"0 of 2 species in
      scope are rare-observation proxies...","weight":0.15},
    "environmental_conditions": {"score":50,"note":"No environmental
      sensor feed connected...","weight":0.1}
  },
  "ecosystem_health_score": 74.6,
  "conservation_status": "Healthy"
}
```

An empty site (0 species observed) scored `42.5` → `"Vulnerable"` in the
same test run, correctly reflecting the formula rather than a flat
default.

---

## Feature F — Dashboards

Every dashboard section named in spec Section 4.11 is implemented in
`DashboardPage.jsx`, role-gated:

- **Researcher:** Species observations (existing), Population Analytics
  (`/population/counts`), Biodiversity Reports (health-score species
  diversity component), Habitat Insights (`/habitat/.../degradation` for
  the researcher's most recently active survey's sites).
- **Conservation Officer:** Threat Monitoring (sites flagged Vulnerable/
  Critical), Conservation Priorities, Species Trend Analysis, Restoration
  Recommendations.
- **Forest Department:** Protected Area Monitoring (grouped by
  `protected_area`), Wildlife Movement Analysis, Patrol Planning (reuses
  monitoring-optimization, filtered to under-covered sites), Incident
  Reports (existing Reports feed).
- **Admin:** unchanged, per spec.

`EcosystemHealthBadge.jsx` is a new reusable component
(green=Excellent/Healthy, yellow=Moderate Concern, orange=Vulnerable,
red=Critical), reusing the existing `badge-ok` / `badge-med` / `badge-high`
CSS classes — no new design system introduced. It's used on the Dashboard,
and inline on `SurveysPage.jsx` when a site is shown.

**Frontend build:** `npm run build` completed clean with no errors —
`vite build`, 39 modules transformed, output verified.

**Not visually verified in a browser** (no browser/UI-testing tool access
in this environment) — every backend endpoint each dashboard section
depends on was confirmed to return valid data via curl for a real test
user of the relevant role, but the actual rendered UI (layout, responsive
behavior, etc.) was not seen. **Please sanity-check the dashboards
visually** once you have this running locally.

---

## Final regression (real output, this session)

```
GET /docs                          -> 200
GET /health                        -> {"status":"ok"}

POST /auth/login (all 4 roles)     -> all succeeded
GET  /auth/me   (all 4 roles)      -> role echoed back correctly

POST /observations/upload-image + /detect      -> 200 (no crash, post warm-up fix)
POST /observations/upload-audio + /detect-sound -> 502 (honest network-blocked error, no crash)

GET /population/counts        (researcher)            -> 200
GET /conservation/priorities  (conservation_officer)   -> 200
GET /population/movement      (forest_department)      -> 200
GET /health/score/all-sites   (administrator)           -> 200

POST /observations/upload-image (conservation_officer, should be blocked) -> 403 Forbidden  ✓ RBAC intact

Server still alive and responsive after the entire regression run.
```

---

## What to do differently in production (summary of every proxy used)

| Feature | What's simulated/proxied here | What would replace it |
|---|---|---|
| Population density | count-per-site | site boundary polygon (PostGIS) ÷ count |
| Migration tracking | site-visit chronology by species | individually tagged/re-identified animals |
| Habitat degradation | recent vs. prior observation-count window | NDVI satellite time series |
| Vegetation analysis | `not_available` | Sentinel Hub / Google Earth Engine / NASA EarthData |
| Environmental conditions | `not_available` (neutral 50 in health score) | real weather/environmental sensor API |
| Endangered species status | ≤2 total observations = "rare" | real IUCN Red List / species conservation status data |
| Conservation recommendations | rule-based templates | ML model trained on real historical conservation-outcome data |
| YAMNet audio classification | untested in this sandbox (network-blocked) | validate against real labeled wildlife audio; tune `CONFIDENCE_THRESHOLD` |

None of these proxies are hidden — every one is called out in the
relevant service file's docstring and reflected honestly in what the
endpoint returns (including plain `"not_available"` where nothing real
exists yet).
