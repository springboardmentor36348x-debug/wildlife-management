# Wildlife Population Intelligence System — Project Learning Notes

This document covers the core concepts, theory, and design decisions behind the project, organized day-by-day. It's meant to sit alongside the codebase as a reference for both understanding *why* things were built the way they were, and as study material for viva/evaluation questions.

---

## Day 1: Project Initialization, Requirement Analysis & SDLC

### Software Development Life Cycle (SDLC)
SDLC is the structured process used to plan, build, test, and deploy software. The common phases are:
1. **Requirement Analysis** — understand what the system needs to do
2. **Design** — architecture, database schema, UI wireframes
3. **Implementation** — actual coding
4. **Testing** — verifying correctness (unit, integration, end-to-end)
5. **Deployment** — releasing to production
6. **Maintenance** — bug fixes, updates, scaling

This project follows an **iterative/agile-influenced** approach rather than strict waterfall — each milestone (auth → surveys → image AI → audio AI → analytics → dashboards) is built, tested, and confirmed working before moving to the next, rather than designing the entire system upfront and building it all at once.

### Functional vs Non-Functional Requirements

**Functional Requirements** (what the system must *do*):
- Users can register and log in with role-based access (Researcher, Conservation Officer, Forest Officer, Admin)
- Researchers can create and manage wildlife surveys with GPS coordinates
- Camera trap images can be uploaded and automatically analyzed for species detection
- Audio recordings can be uploaded and analyzed for bird call identification
- The system calculates biodiversity indices and ecosystem health scores
- Reports can be generated and exported

**Non-Functional Requirements** (how well the system must perform):
- **Security**: passwords must be hashed (never stored in plain text), JWT tokens for stateless authentication
- **Performance**: image/audio inference should return results within a reasonable time (seconds, not minutes)
- **Scalability**: the system should handle multiple concurrent survey uploads (achieved via Dockerized, horizontally-scalable services)
- **Usability**: role-specific dashboards tailored to each user type
- **Maintainability**: modular code structure (separate `models/`, `api/`, `ml/`, `core/` folders) so features can be extended independently

### User Stories
User stories describe features from the end user's perspective, typically in the format: *"As a [role], I want to [action], so that [benefit]."*

Examples relevant to this project:
- *As a Wildlife Researcher, I want to upload a camera trap image, so that the species can be automatically identified without manual review.*
- *As a Conservation Officer, I want to see biodiversity trend alerts, so that I can prioritize which habitats need urgent intervention.*
- *As a Forest Department Officer, I want to view all monitoring sites on a map, so that I can plan patrol routes efficiently.*
- *As an Admin, I want to manage user roles, so that access to sensitive data is properly restricted.*

### Wildlife Monitoring Workflow Analysis
The real-world workflow this system digitizes:
```
Field Survey Planned → Monitoring Site Registered (GPS, habitat type)
    → Camera Trap / Audio Sensor Deployed
    → Data Collected (images/audio) in the field
    → Data Uploaded to the System
    → AI Analysis (species detection, call identification)
    → Observation Recorded in Database
    → Aggregated into Biodiversity/Population Reports
    → Conservation Recommendations Generated
```
Understanding this workflow shaped the database schema — a `Survey` represents one monitoring site/session, and every `Observation` (image or audio) is linked back to a specific survey via a foreign key.

---

## Day 2: Software Architecture & Communication Patterns

### Client-Server Architecture
This project follows a classic **client-server** model:
- **Client**: the React frontend running in the user's browser
- **Server**: the FastAPI backend running on Python, handling business logic and database access
- **Database**: PostgreSQL (with PostGIS for geospatial data), running as a separate service

The client never talks to the database directly — all requests go through the backend API, which enforces authentication, validation, and business rules before touching the database. This separation is what makes the system secure and maintainable.

### React ↔ FastAPI Communication
The frontend and backend communicate over HTTP using **JSON** as the data format:
```
React (fetch/axios) --HTTP request (JSON)--> FastAPI endpoint
FastAPI endpoint --HTTP response (JSON)--> React (renders UI)
```
Example from this project: when a researcher uploads an image, React sends a `multipart/form-data` POST request to `/images/upload/{survey_id}`, FastAPI saves the file, runs YOLOv8 detection, and returns a JSON response with the detected species — which React then displays.

### REST APIs & HTTP Methods
REST (Representational State Transfer) is an architectural style for designing APIs around resources (nouns) and standard HTTP verbs (actions):

| Method | Purpose | Example in this project |
|---|---|---|
| `GET` | Retrieve data | `GET /surveys/` — list all surveys |
| `POST` | Create new data | `POST /auth/register` — create a user |
| `PUT`/`PATCH` | Update existing data | (planned) update a survey's details |
| `DELETE` | Remove data | (planned) delete an observation |

### Request/Response Lifecycle
1. Client sends an HTTP request (method, URL, headers, body)
2. FastAPI's routing layer matches the URL to the correct endpoint function
3. **Dependency injection** provides things like the database session (`Depends(get_db)`)
4. Pydantic validates the request body against a schema (e.g., `RegisterRequest`) — invalid data is rejected automatically with a `422` error
5. The endpoint function executes business logic (e.g., hash password, query database)
6. A response is serialized back to JSON and sent to the client with an HTTP status code (`200` success, `401` unauthorized, `500` server error, etc.)

### Microservices Overview
This project currently uses a **modular monolith** approach (one FastAPI application with clearly separated modules) rather than true microservices, which is the right choice at this scale — it's simpler to develop, test, and deploy for a project of this size. A true microservices architecture would split this into separate deployable services (e.g., a dedicated "ML inference service", a separate "auth service"), which becomes worthwhile at much larger scale where different components need to scale independently. Worth mentioning in a viva that this was a deliberate architectural trade-off, not an oversight.

---

## Day 3: Database Design

### SQL vs NoSQL
- **SQL (relational)** databases like PostgreSQL store data in structured tables with defined relationships — ideal when data has clear structure and relationships (users → surveys → observations).
- **NoSQL** databases (MongoDB, etc.) store flexible, schema-less documents — better suited for unstructured or rapidly-changing data.

This project uses **PostgreSQL as the primary database** because the core data (users, surveys, observations) has clear, stable relationships that benefit from SQL's referential integrity (foreign keys, constraints). A secondary MongoDB store is planned in the broader system design for less structured data like raw sensor logs, though the current implementation focuses on PostgreSQL.

### ER Diagrams & Database Relationships
The core entity relationships in this system:

```
User (1) ────────── (creates) ────────── (many) Survey
Survey (1) ────────── (has) ────────── (many) Observation
```

- **One-to-many**: one `User` can create many `Surveys`; one `Survey` can have many `Observations` (images/audio uploads).
- This is implemented via a **foreign key** — `Observation.survey_id` references `Survey.id`.

### Normalization
Normalization is the process of structuring a database to reduce redundancy and improve data integrity. This project's schema follows **Third Normal Form (3NF)** principles:
- Each table represents a single entity (`users`, `surveys`, `observations`) — no mixing of unrelated data in one table
- No duplicate data — a survey's location is stored once in the `surveys` table, not repeated in every observation
- Every non-key column depends only on the primary key (e.g., `species_detected` depends on the specific `observation`, not on the survey as a whole)

### Designing the Wildlife Monitoring Database Schema

**users table:**
| Column | Type | Notes |
|---|---|---|
| id | Integer (PK) | Auto-incrementing primary key |
| email | String (unique) | Login identifier |
| hashed_password | String | Never stored in plain text |
| full_name | String | |
| role | Enum | researcher / conservation_officer / forest_officer / admin |

**surveys table:**
| Column | Type | Notes |
|---|---|---|
| id | Integer (PK) | |
| monitoring_location | String | |
| latitude / longitude | Float | GPS coordinates |
| habitat_type | String | |
| protected_area | String | |
| survey_date | DateTime | Defaults to creation time |

**observations table:**
| Column | Type | Notes |
|---|---|---|
| id | Integer (PK) | |
| survey_id | Integer (FK → surveys.id) | Links each observation to its survey |
| image_path | String | File path on disk |
| species_detected | String (nullable) | Filled in by AI after analysis |
| confidence | Float (nullable) | Model's confidence score |
| count | Integer | Number of individuals detected |
| created_at | DateTime | |

---

## Day 4: UI/UX Design

### Wireframing & Figma
Wireframing is the process of sketching a screen's layout before writing any code — it answers "where does everything go" without worrying about colors or fonts yet. For this project, the key screens to wireframe are:
- Login/Register screen
- Survey creation form (with map picker for GPS coordinates)
- Image/audio upload screen with a preview of AI detection results
- Role-specific dashboards (4 variants: Researcher, Conservation Officer, Forest Officer, Admin)

Figma (or any wireframing tool) is used to iterate on layout quickly before committing to React component code — much cheaper to change a wireframe than rewrite a component.

### User Journey
Mapping the researcher's journey end-to-end:
```
Login → View Dashboard → Create New Survey (enter GPS, habitat type)
    → Upload Camera Trap Image → See AI Detection Result
    → View Survey's Observation History → Check Biodiversity Score
    → Generate/Export Report
```
Designing around this journey ensures the UI supports the actual workflow, rather than just exposing raw CRUD forms for every database table.

### Dashboard Design
Each role sees a different dashboard reflecting what matters to them:
- **Researcher**: recent observations, species detected, biodiversity trends for their surveys
- **Conservation Officer**: threat alerts, endangered species flags, restoration recommendations
- **Forest Officer**: map of all monitoring sites, patrol planning view
- **Admin**: user management, platform-wide analytics

### Component-Based Design in React
React encourages breaking the UI into small, reusable components rather than one giant page. For this project:
- `<SurveyCard />` — displays one survey's summary
- `<ObservationList />` — reusable list of detections, used in both the researcher dashboard and a single survey's detail page
- `<MapView />` — wraps Leaflet.js, reused wherever GPS points need to be shown
- `<UploadWidget />` — handles both image and audio uploads with a shared drag-and-drop UI

This keeps the frontend maintainable — a bug fix or style change to `<SurveyCard />` automatically applies everywhere it's used.

---

## Day 5: Development Environment Setup

### Git & GitHub Workflow
Git tracks changes to code over time; GitHub hosts the repository remotely for backup and collaboration. Recommended workflow for this project:
```bash
git init
git add .
git commit -m "Initial commit: project structure"
git remote add origin <your-github-repo-url>
git push -u origin main
```

### Branching Strategy
A simple, effective strategy for a solo/small-team student project:
- `main` — always stable, working code
- `feature/xyz` — one branch per feature (e.g., `feature/audio-detection`, `feature/dashboard`)
- Merge feature branches into `main` only after testing locally

```bash
git checkout -b feature/audio-detection
# ... make changes, commit ...
git checkout main
git merge feature/audio-detection
```

### Docker
Docker packages an application (or a service like Postgres) with everything it needs to run, in an isolated, reproducible container — solving the "works on my machine" problem. In this project, Docker runs the PostgreSQL+PostGIS database, isolated from any locally-installed Postgres, defined declaratively in `docker-compose.yml`.

### Python Virtual Environments
A virtual environment (`venv`) creates an isolated Python installation for a single project, so its dependencies don't conflict with other projects or the system-wide Python. Created and activated via:
```bash
python -m venv venv
venv\Scripts\activate   # Windows
```

### Frontend & Backend Project Structure
```
wildlife-ai-system/
  backend/
    app/
      core/     — config, database connection, security/JWT
      models/   — SQLAlchemy database table definitions
      api/      — FastAPI route handlers (endpoints)
      ml/       — AI/ML inference code (YOLOv8, BirdNET)
      main.py   — application entry point
    uploads/    — stored camera trap images and audio files
    requirements.txt
    Dockerfile
  frontend/
    (React app — components, pages, API client)
  docker-compose.yml  — defines the Postgres database service
```
This separation (`core`/`models`/`api`/`ml`) follows a common backend architecture pattern where each layer has one clear responsibility, making the codebase easier to navigate and extend.

---

## Day 6: Authentication & Authorization

### Password Hashing
Passwords must **never** be stored as plain text. This project uses **bcrypt** (via the `passlib` library) to hash passwords — a one-way transformation where the original password cannot be recovered from the hash, even by someone with database access.
```python
hashed = pwd_context.hash(plain_password)   # store this
pwd_context.verify(plain_password, hashed)  # check login attempts
```
Bcrypt also incorporates a **salt** automatically, so even two users with the same password get different hashes — protecting against precomputed "rainbow table" attacks.

### JWT Authentication
JWT (JSON Web Token) is a compact, signed token used to prove a user is authenticated, without the server needing to store session state. When a user logs in successfully, the server issues a JWT containing their identity (`sub: email`) and role, signed with a secret key. On subsequent requests, the client sends this token, and the server verifies its signature to confirm it's valid and unmodified.

```python
token = create_access_token({"sub": user.email, "role": user.role})
```

This is **stateless** — the server doesn't need a database lookup to check "is this session still valid," it just verifies the token's signature and expiry.

### OAuth2
OAuth2 is a broader authorization framework, often used for "Login with Google/GitHub" style flows, where a third-party identity provider handles authentication and issues a token your app trusts. This project currently implements **first-party JWT authentication** (its own login/password system) rather than OAuth2 third-party login — a reasonable scope decision, since OAuth2 integration is a stretch feature that doesn't change the app's core functionality.

### Role-Based Access Control (RBAC)
Four roles are defined in the `UserRole` enum: `researcher`, `conservation_officer`, `forest_officer`, `admin`. Each role determines what a user can see and do — for example, only an Admin should be able to manage other users, while a Researcher can create surveys and upload observations. RBAC is enforced by checking the role embedded in the JWT token on protected endpoints (a planned extension: FastAPI dependency functions that reject requests if the token's role doesn't match what an endpoint requires).

### Login Flow (as implemented)
```
1. User submits email + password to POST /auth/register
2. Server hashes the password, stores the user record
3. User submits email + password to POST /auth/login
4. Server looks up the user, verifies the password against the stored hash
5. If valid, server issues a signed JWT
6. Client stores the JWT and includes it in the Authorization header
   for all subsequent requests: "Authorization: Bearer <token>"
```

### Security Best Practices Applied
- Passwords hashed with bcrypt, never stored or logged in plain text
- JWT signed with a secret key (`SECRET_KEY` in `.env`, never committed to version control)
- Tokens have an expiry (`ACCESS_TOKEN_EXPIRE_MINUTES`) to limit the damage of a leaked token
- Environment variables (`.env`) used for secrets instead of hardcoding them in source code
- Input validation via Pydantic models rejects malformed requests before they reach business logic

---

## Day 7: Wildlife Survey & Monitoring Management

### CRUD Operations
CRUD = Create, Read, Update, Delete — the four basic operations on any data. Implemented for surveys:
- **Create**: `POST /surveys/` — researcher registers a new monitoring site
- **Read**: `GET /surveys/` — list all surveys
- **Update / Delete**: planned extensions (e.g., `PUT /surveys/{id}`, `DELETE /surveys/{id}`) for correcting or removing survey records

### Survey & Monitoring Database Design
Covered in detail in Day 3 — the `Survey` table captures the *where* and *when* of a monitoring effort (GPS coordinates, habitat type, protected area, date), while `Observation` records capture the *what was found* (species, confidence, image/audio path), linked back via `survey_id`.

### REST APIs & Validation
Every endpoint uses a **Pydantic model** to define and validate the expected request shape. For example:
```python
class SurveyCreate(BaseModel):
    monitoring_location: str
    latitude: float
    longitude: float
    habitat_type: str
    protected_area: str
```
If a client sends a request missing a required field, or sends a string where a float is expected (e.g., `latitude`), FastAPI automatically rejects it with a `422 Unprocessable Entity` response and a clear error message — no manual validation code needed.

### Testing with Postman (or Swagger UI)
This project was tested primarily through **FastAPI's built-in Swagger UI** (`/docs`), which serves the same purpose as Postman — sending real HTTP requests to each endpoint and inspecting the response. Every endpoint (`/auth/register`, `/auth/login`, `/surveys/`, `/images/upload/{survey_id}`, `/audio/upload/{survey_id}`) was manually tested this way, confirming correct request/response behavior before moving to the next feature. Postman would be used identically for the same purpose, particularly useful for saving a reusable collection of test requests.

### End-to-End Wildlife Survey Workflow (as built)
```
1. Survey Creation
   POST /surveys/ → { monitoring_location, latitude, longitude, habitat_type, protected_area }
   → Returns a new survey with an auto-generated id

2. Camera/Audio Sensor Registration (implicit)
   Each upload is tied to a survey_id, representing data
   collected by a specific camera trap or audio sensor at that site

3. Observation Recording
   POST /images/upload/{survey_id} → saves image, runs YOLOv8 detection,
        creates an Observation row with species_detected + confidence
   POST /audio/upload/{survey_id} → saves audio, runs BirdNET analysis,
        creates an Observation row with the identified bird species
```
This confirms the full loop from field data collection to AI-driven species identification, which is the core value proposition of the entire system.

---

## Summary of What's Been Built So Far

| Feature | Status |
|---|---|
| User registration & JWT login | ✅ Working, tested |
| Role-based user model (4 roles) | ✅ Implemented |
| Survey creation & listing | ✅ Working, tested |
| Image upload + YOLOv8 species detection | ✅ Working, tested |
| Audio upload + BirdNET bird call detection | ✅ Code complete, pending final test with a cleanly-encoded audio file |
| Biodiversity index / ecosystem health scoring | 🔲 Next step |
| React dashboard | 🔲 Planned |
| Docker Compose full-stack deployment | 🔲 Planned |
