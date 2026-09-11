"""
Wildlife Population Intelligence System - FastAPI backend entrypoint.

Scope:
  - App bootstrap + CORS
  - DB table creation (SQLAlchemy metadata)
  - Mounted routers: auth, users, surveys/sites, observations, datasets,
    reports, population, habitat, conservation, health, incidents, gis, admin
"""
from fastapi import FastAPI
from fastapi.middleware.cors import CORSMiddleware
from fastapi.staticfiles import StaticFiles
import os

from app.core.config import settings
from app.db.session import engine, Base
from app.api.router import api_router

# Import models so their tables are registered on Base.metadata
from app import models  # noqa: F401

app = FastAPI(
    title=settings.PROJECT_NAME,
    description=(
        "AI-Powered Wildlife Population Intelligence System - "
        "Population Intelligence & Conservation."
    ),
    version="0.3.0",
)

app.add_middleware(
    CORSMiddleware,
    allow_origins=settings.cors_origins_list,
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

os.makedirs(settings.UPLOAD_DIR, exist_ok=True)
app.mount("/uploads", StaticFiles(directory=settings.UPLOAD_DIR), name="uploads")


@app.on_event("startup")
def on_startup() -> None:
    Base.metadata.create_all(bind=engine)

    # Warm up YOLO model if available (prevents TF/PyTorch conflict)
    try:
        import numpy as np
        from app.services.vision_service import detect_animals

        _warmup_path = os.path.join(settings.UPLOAD_DIR, ".yolo_warmup.jpg")
        if not os.path.exists(_warmup_path):
            from PIL import Image

            Image.fromarray(
                np.zeros((64, 64, 3), dtype=np.uint8)
            ).save(_warmup_path)
        detect_animals(_warmup_path)
    except Exception as exc:  # noqa: BLE001
        print(f"[startup] YOLO warm-up skipped/failed (non-fatal): {exc}")


@app.get("/", tags=["Health"])
def root():
    return {
        "service": settings.PROJECT_NAME,
        "status": "online",
        "milestone": "3 - Population Intelligence & Conservation",
    }


@app.get("/health", tags=["Health"])
def health_check():
    return {"status": "ok"}


app.include_router(api_router, prefix=settings.API_V1_PREFIX)
