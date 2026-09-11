from fastapi import APIRouter

from app.api.routes import (
    auth,
    users,
    surveys,
    observations,
    datasets,
    reports,
    population,
    habitat,
    conservation,
    health,
    incidents,
    gis,
    admin,
)

api_router = APIRouter()
api_router.include_router(auth.router)
api_router.include_router(users.router)
api_router.include_router(surveys.router)
api_router.include_router(observations.router)
api_router.include_router(datasets.router)
api_router.include_router(reports.router)
api_router.include_router(population.router)
api_router.include_router(habitat.router)
api_router.include_router(conservation.router)
api_router.include_router(health.router)
api_router.include_router(incidents.router)
api_router.include_router(gis.router)
api_router.include_router(admin.router)
