"""
Wildlife Population Intelligence System - FastAPI application entrypoint.

Run locally:
    uvicorn app.main:app --reload

Docs available at:
    http://localhost:8000/docs
"""
from fastapi import FastAPI
from fastapi.middleware.cors import CORSMiddleware

from app.config import settings
from app.database import Base, engine
from app import models  # noqa: F401  (ensures all models are registered on Base)
from app.routers import (
    auth, users, monitoring_sites, surveys, images, audio, species, biodiversity,
    population, habitat, conservation, live_map, reports,
)

from contextlib import asynccontextmanager

@asynccontextmanager
async def lifespan(app: FastAPI):
    Base.metadata.create_all(bind=engine)
    yield

app = FastAPI(
    title="Wildlife Population Intelligence System API",
    description=(
        "AI-powered platform for wildlife species identification, bioacoustic "
        "recognition, population intelligence, and biodiversity analytics."
    ),
    version="0.1.0",
    lifespan=lifespan,
)

app.add_middleware(
    CORSMiddleware,
    allow_origins=settings.cors_origins_list,
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)


@app.get("/", tags=["Health"])
def root():
    return {
        "service": "Wildlife Population Intelligence System",
        "status": "running",
        "docs": "/docs",
    }


@app.get("/health", tags=["Health"])
def health_check():
    return {"status": "ok"}


# --- Milestone 1 routers ---
app.include_router(auth.router)
app.include_router(users.router)
app.include_router(monitoring_sites.router)
app.include_router(surveys.router)

# --- Milestone 2 routers ---
app.include_router(images.router)
app.include_router(audio.router)
app.include_router(species.router)
app.include_router(biodiversity.router)

# --- Milestone 3 routers ---
app.include_router(population.router)
app.include_router(habitat.router)
app.include_router(conservation.router)

# --- Milestone 4 routers ---
app.include_router(live_map.router)
app.include_router(reports.router)
