"""
Part 2 — Wildlife Survey & Monitoring role permissions.

Reuses the existing JWT auth (auth.get_current_user) and role enum
(models.UserRole) from Part 1. This is NOT a second auth system —
just FastAPI dependencies built on top of auth.require_roles.

Permission matrix (per spec):
- Wildlife Researcher, Forest Department Officer, Administrator:
  full create/update on Survey, MonitoringSite, CameraTrap, AudioSensor
- Conservation Officer: view everything; create/update ONLY on
  Observation (their conservation-monitoring data) — no CRUD on
  Survey / MonitoringSite / CameraTrap / AudioSensor
- Permanent delete of ANY Part 2 resource: Administrator ONLY
"""
from auth import get_current_user, require_roles
import models

# Anyone authenticated & approved (any of the 4 roles) can view Part 2 data
view_any = get_current_user

# Create/update on Survey, MonitoringSite, CameraTrap, AudioSensor
manage_site_infra = require_roles([
    models.UserRole.researcher,
    models.UserRole.forest_officer,
    models.UserRole.admin,
])

# Create/update on Observation (conservation officer included)
manage_observations = require_roles([
    models.UserRole.researcher,
    models.UserRole.conservation_officer,
    models.UserRole.forest_officer,
    models.UserRole.admin,
])

# Permanent delete of ANY Part 2 resource — admin only
admin_only = require_roles([models.UserRole.admin])
