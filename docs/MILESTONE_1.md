# Milestone 1 (Week 1 & 2) — Project Initialization, Design Process & Core Setup

## What's implemented

### 1. User Authentication & Role-Based Access
- `POST /api/v1/auth/register`, `POST /api/v1/auth/login`, `GET /api/v1/auth/me`
- JWT auth via `python-jose`, passwords hashed with `bcrypt` (`app/auth/security.py`)
- Role-based access control via `require_roles(...)` dependency
- Roles: `wildlife_researcher`, `conservation_officer`, `forest_department_officer`, `administrator`
- `GET /api/v1/users/` and `PATCH /api/v1/users/{id}/deactivate` — admin-only

### 2. Wildlife Survey & Monitoring Management
- Monitoring sites: `POST/GET /api/v1/monitoring-sites/` (GPS, habitat type, protected area)
- Monitoring devices: `POST /api/v1/monitoring-sites/devices` — **API only, no frontend UI yet**
- Surveys: `POST/GET /api/v1/surveys/`

### Frontend
- `/login`, `/register`, `/` (dashboard), `/monitoring-sites`, `/surveys`
- No dedicated Devices page yet (backend endpoint exists, unused by frontend)

## Database schema (Milestone 1 tables)
- `users`, `monitoring_sites`, `monitoring_devices`, `surveys`
