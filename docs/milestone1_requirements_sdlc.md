# Milestone 1: Requirements & Software Development Life Cycle (SDLC) Analysis

## 1. Project Overview & SDLC Methodology
The **AI-Powered Wildlife Population Intelligence System** is engineered to automate species identification, count estimation, habitat health assessment, and poaching/threat detection using AI models (YOLOv8, YAMNet/BirdNET, PostGIS geospatial analytics).

### Chosen SDLC Model: **Iterative & Agile SDLC**
* **Why Agile/Iterative?** Wildlife monitoring requires phased data ingestion, continuous model evaluation, multi-role user dashboards, and rapid deployment of threat detection algorithms.
* **Sprint / Milestone Breakdown:**
  * **Day 1 / Milestone 1:** Project Initialization, Requirement Analysis, Architecture Design, Role-Based Access Control (RBAC), Initial Database Schemas, and Dataset Pipeline Setup.
  * **Milestone 2 (Upcoming):** Data Preprocessing, Dataset Cleaning, and Data Pipeline Automation.
  * **Milestone 3 (Upcoming):** Computer Vision & Bioacoustic Model Training (YOLOv8, BirdNET).
  * **Milestone 4 (Upcoming):** Geospatial Analysis, Biodiversity Analytics Engine, Ecosystem Health Index Calculation.
  * **Milestone 5 (Upcoming):** Full System Integration, Role-Based Web Interface Polish, System Testing & Deployment.

---

## 2. Wildlife Monitoring Workflow Analysis
The end-to-end data lifecycle follows a 5-stage automated and human-in-the-loop workflow:

```
[ Field Sensor / Camera / Drone / Audio Node ]
                       │
                       ▼
[ Data Ingestion Pipeline (Images/Audio/Metadata) ]
                       │
                       ▼
[ AI Detection & Acoustic Models (YOLOv8, YAMNet) ]
                       │
                       ▼
[ Intelligence Engine (Density, Biodiversity Score, Fire/Threat Detection) ]
                       │
                       ▼
[ Role-Based Dashboard Alerting & Incident Dispatch (Admin, Researcher, Officer, Forest Dept) ]
```

1. **Survey Definition:** Researchers/Officers register monitoring sites with GPS coordinates, habitat parameters, and attached sensing hardware.
2. **Multi-Modal Data Ingestion:** Upload and stream visual (Camera Trap / Drone images) and audio (acoustic files) data along with environmental telemetry (temperature, humidity).
3. **AI Processing Pipeline:** Automated detection, bounding box extraction, classification, confidence scoring, and audio frequency pattern matching.
4. **Intelligence & Ecosystem Analysis:** Automated calculation of species richness, population density estimates, and threat/poaching alert generation.
5. **Actionable Command Response:** Role-tailored UI views trigger automated alerts to Conservation Officers and Forest Wardens for immediate threat response or ecological reporting.

---

## 3. Functional vs. Non-Functional Requirements

### A. Functional Requirements (FR)
1. **User Authentication & Role-Based Access Control (RBAC):**
   * Support distinct access policies for `Administrator`, `Researcher`, `Conservation Officer`, and `Forest Department`.
   * Secure JWT authentication and password hashing (FastAPI + OAuth2).
2. **Survey & Site Tracking Management:**
   * Capability to create, track, and modify multi-zone monitoring surveys with start/end dates and protected area boundaries.
3. **Multi-Modal Dataset Ingestion:**
   * Ingest image, video, and audio datasets (e.g., Snapshot Serengeti, iNaturalist Mini, GBIF, BirdCLEF).
4. **AI Species Recognition & Detection (Planned Core Pipeline):**
   * Detect and classify wildlife species from camera trap images and sound logs with confidence scores.
5. **Alerting & Threat Dispatch System:**
   * Real-time notifications for illegal intrusion, poaching indicators, camera node downtime, and fire risk alerts.
6. **Geospatial & Biodiversity Dashboard:**
   * Visual map coordinates for species sightings, patrol zones, and wildlife corridors.

### B. Non-Functional Requirements (NFR)
1. **Security & Data Privacy:**
   * Role-based endpoints (RBAC) to ensure unauthenticated users cannot alter survey zones or access sensitive endangered species GPS locations.
2. **Performance & Scalability:**
   * FastAPI backend response time under 100ms for standard database queries.
   * Capability to scale database indexing for high-volume observation logs (MongoDB + PostGIS).
3. **Reliability & Availability:**
   * System resilience to handle missing telemetry or offline field camera synchronization.
4. **Usability & Aesthetic Standards:**
   * High-contrast, clean corporate aesthetic with SVG icons, intuitive color-coded status badges, and mobile-responsive dashboards.
5. **Maintainability & Extensibility:**
   * Modular architecture separating Frontend (React), Backend REST API (FastAPI), Relational GIS Data (PostgreSQL/PostGIS), and Unstructured Metadata (MongoDB).

---

## 4. User Stories & Acceptance Criteria

### User Story 1: Conservation Officer Threat Alerting
* **As a** Conservation Officer
* **I want to** receive immediate alerts when high-risk or poaching events are detected in a protected zone
* **So that** I can dispatch field response teams to the exact GPS coordinates.
* **Acceptance Criteria:**
  - Alert displays severity level (`HIGH`, `MED`, `LOW`), timestamp, and zone location.
  - Officer can view the status of active field teams assigned to the zone.

### User Story 2: Wildlife Researcher Data Ingestion
* **As a** Wildlife Researcher
* **I want to** upload image and audio datasets and run automated species classification
* **So that** I can assess species richness and population trends without manual tagging.
* **Acceptance Criteria:**
  - Support ingestion of external datasets (Snapshot Serengeti, iNaturalist, GBIF).
  - Provide clear species detection lists with match confidence percentages.

### User Story 3: Forest Department Patrol & Corridor Management
* **As a** Forest Warden
* **I want to** monitor active patrol routes, fire risk levels, and wildlife corridor statuses
* **So that** I can ensure safe animal migration and prevent habitat destruction.
* **Acceptance Criteria:**
  - Patrol zone table shows real-time clear/alert status and responsible team assignments.
  - Risk indicators highlight fire hazard zones for preventive management.

---

## 5. Day 1 Verification Summary
| Component | Status | Details |
| :--- | :---: | :--- |
| **Project Initialization** | **COMPLETE** | React frontend + FastAPI backend + database models initialized. |
| **Requirement Analysis** | **COMPLETE** | Detailed functional & non-functional requirements documented. |
| **SDLC Definition** | **COMPLETE** | Iterative/Agile SDLC selected with milestone roadmap. |
| **Functional vs Non-Functional** | **COMPLETE** | Formally categorized into FR & NFR matrices. |
| **User Stories** | **COMPLETE** | Defined across key roles with clear acceptance criteria. |
| **Workflow Analysis** | **COMPLETE** | Full sensor-to-dashboard intelligence pipeline mapped out. |
