# 🦁 Wildlife Population Intelligence System

A full-stack web application for wildlife researchers, conservation officers, and forest department officials to monitor, analyze, and manage wildlife population data using AI-powered insights.

---

## ✨ Key Features

- **📸 Computer Vision Species Detection:** Upload images for automated species classification and count estimations powered by custom YOLOv9 models.
- **🎙️ Bioacoustic Recognition:** Analyze field audio recordings (`.wav`, `.mp3`, `.flac`) to identify wildlife vocalizations and species presence.
- **📊 Population & Ecosystem Intelligence:** Time-series trends, density maps, Shannon-Wiener biodiversity index, and habitat degradation risk modeling.
- **💡 Automated Conservation Action Recommendations:** Algorithmic prioritization of conservation interventions based on IUCN status and population decline.
- **📄 Professional PDF & CSV Reporting:** Generate and download official summary reports for administrative and field operations.
- **🔐 Role-Based Access Control (RBAC):** Multi-tier authorization for Administrators, Wildlife Researchers, Conservation Officers, and Forest Officers.

---

## 🚀 Tech Stack

**Frontend**
- React 19 + Vite
- React Router, Framer Motion, Recharts
- Leaflet (Interactive Maps)
- Tailwind CSS

**Backend**
- FastAPI (Python)
- PostgreSQL (Neon) + SQLAlchemy
- PyTorch + Ultralytics (YOLOv9)
- OpenCV & Pillow (Image Processing)
- ReportLab & Pandas (PDF / CSV Export)
- JWT Authentication

---

## 📁 Project Structure

```
Wildlife_Population_Intelligence_System/
├── backend/                           # FastAPI backend
│   ├── main.py                        # FastAPI entry point & Auth endpoints
│   ├── auth.py                        # JWT Auth & RBAC middlewares
│   ├── database.py                    # PostgreSQL DB connection
│   ├── models.py                      # User & Auth models
│   ├── models_monitoring.py           # Monitoring sites, sensors, surveys & observation models
│   ├── permissions.py                 # Fine-grained role permissions
│   ├── schemas.py                     # Auth Pydantic schemas
│   ├── schemas_monitoring.py          # Infrastructure & survey schemas
│   ├── schemas_intelligence.py        # Analytics & report schemas
│   ├── routers/                       # Modular API Routers
│   │   ├── detection.py               # YOLOv9 image detection router
│   │   ├── audio.py                   # Bioacoustic recognition router
│   │   ├── intelligence.py            # Ecosystem intelligence & reporting router
│   │   └── monitoring.py              # Monitoring sites, traps & observations router
│   ├── services/                      # Business logic & AI inference services
│   │   ├── yolo_service.py            # YOLO model inference
│   │   ├── audio_service.py           # Audio processing pipeline
│   │   ├── population_service.py      # Population analytics & trends
│   │   ├── habitat_service.py         # Habitat risk assessment
│   │   ├── conservation_service.py    # Algorithmic recommendations
│   │   ├── analytics_service.py       # Biodiversity metrics
│   │   └── report_service.py          # PDF & CSV generation
│   ├── weights/                       # Model weights (.pt)
│   ├── yolov9_repo/                   # YOLOv9 repository dependencies
│   ├── requirements.txt
│   └── .env.example                   # Environment template
└── frontend/                          # React frontend
    ├── src/
    │   ├── api/                       # Axios client & API endpoints
    │   ├── components/                # Reusable UI components & modals
    │   ├── pages/                     # Dashboard, Detection, Intelligence & Monitoring pages
    │   ├── context/                   # Auth & Application context
    │   └── routes/                    # Protected routes & Navigation
    └── package.json
```

---

## ⚙️ Setup & Installation

### 1. Clone the Repository
```bash
git clone -b intern-jaspinder-kaur-walia https://github.com/springboardmentor36348x-debug/wildlife-management.git
cd wildlife-management
```

### 2. Backend Setup
```bash
cd backend
python -m venv venv
venv\Scripts\activate        # Windows
# or source venv/bin/activate # Linux/Mac

pip install -r requirements.txt
```

Create your `.env` file:
```bash
cp .env.example .env
```
Fill in your `DATABASE_URL` in `.env`.

Run the backend:
```bash
uvicorn main:app --reload
```
API will be available at: `http://localhost:8000`

### 3. Frontend Setup
```bash
cd frontend
npm install
npm run dev
```
Frontend will be available at: `http://localhost:5173`

---

## 👥 User Roles

| Role | Description |
|------|-------------|
| **Administrator** | Full access, manages & approves users, infrastructure management |
| **Wildlife Researcher** | Research data access, image/audio detection, observation logging |
| **Conservation Officer** | Conservation management, habitat risk assessment, report export |
| **Forest Department Officer** | Field operations, camera trap & sensor monitoring |

> **Note:** The first registered user is auto-approved as Administrator.

---

## 📡 Key API Endpoints

### 🔐 Authentication & Admin
| Method | Endpoint | Description |
|--------|----------|-------------|
| POST | `/auth/register` | Register new user |
| POST | `/auth/login` | Login & receive JWT access token |
| GET | `/auth/me` | Get current authenticated user profile |
| GET | `/admin/users` | List all users (Admin only) |
| PUT | `/admin/users/{id}/approve` | Approve/reject registered user (Admin only) |
| PUT | `/admin/users/{id}/role` | Modify user role (Admin only) |

### 🤖 AI Detection & Bioacoustics
| Method | Endpoint | Description |
|--------|----------|-------------|
| POST | `/api/v1/detect-species` | YOLOv9 automated image species detection & count |
| POST | `/api/v1/analyze-audio` | Audio file bioacoustic species identification |

### 🧠 Intelligence & Analytics
| Method | Endpoint | Description |
|--------|----------|-------------|
| GET | `/api/v1/intelligence/population/overview` | Population trends, growth rates & density |
| GET | `/api/v1/intelligence/habitat/overview` | Ecosystem quality & degradation risk index |
| GET | `/api/v1/intelligence/conservation/recommendations` | Prioritized conservation action recommendations |
| GET | `/api/v1/intelligence/analytics/biodiversity` | Shannon-Wiener index & ecosystem health metrics |
| GET | `/api/v1/intelligence/reports/export/pdf` | Download official formatted PDF report |
| GET | `/api/v1/intelligence/reports/export/csv` | Download consolidated data spreadsheet (.csv) |

### 📡 Monitoring & Field Infrastructure
| Method | Endpoint | Description |
|--------|----------|-------------|
| GET / POST | `/monitoring-sites` | Manage monitoring sites & habitats |
| GET / POST | `/camera-traps` | Manage camera trap deployments |
| GET / POST | `/audio-sensors` | Manage bioacoustic audio sensors |
| GET / POST | `/surveys` | Record field monitoring surveys |
| GET / POST | `/observations` | Log wildlife observations & sightings |
| GET | `/monitoring/stats` | High-level infrastructure summary stats |
