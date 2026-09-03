"""
Wildlife Population Intelligence System - FastAPI Backend
Main application entry point
"""

from fastapi import FastAPI, Depends, HTTPException
from fastapi.middleware.cors import CORSMiddleware
from fastapi.security import HTTPBearer
from fastapi.staticfiles import StaticFiles
from sqlalchemy.orm import Session
import logging
import os
from datetime import datetime

# Import database
from database import engine, Base, get_db
from models import User, UserRole, Species, Survey, MonitoringSite, Device, Observation

# Import routers
from routers import auth, users, surveys, monitoring_sites, devices, observations, species
from routers import image_analysis, audio_analysis, population, biodiversity
from routers import habitat, conservation, gis, reports, admin

# Import schemas
from schemas.auth import TokenResponse

# Configure logging
logging.basicConfig(
    level=logging.INFO,
    format='%(asctime)s - %(name)s - %(levelname)s - %(message)s'
)
logger = logging.getLogger(__name__)

# Create tables
Base.metadata.create_all(bind=engine)

# Initialize FastAPI app
app = FastAPI(
    title="Wildlife Population Intelligence System",
    description="AI-powered wildlife monitoring and conservation platform",
    version="1.0.0",
    docs_url="/docs",
    redoc_url="/redoc",
    openapi_url="/openapi.json"
)

# Configure CORS
app.add_middleware(
    CORSMiddleware,
    allow_origins=[
        "http://localhost:3000",
        "http://localhost:5173",
        "http://127.0.0.1:3000",
        "http://127.0.0.1:5173"
    ],
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

# Serve uploaded files (images, audio, spectrograms, reports)
os.makedirs("uploads/images", exist_ok=True)
os.makedirs("uploads/audio", exist_ok=True)
os.makedirs("uploads/spectrograms", exist_ok=True)
os.makedirs("uploads/reports", exist_ok=True)
app.mount("/uploads", StaticFiles(directory="uploads"), name="uploads")

# Health check endpoint
@app.get("/health")
async def health_check():
    """Health check endpoint"""
    try:
        from sqlalchemy import text
        db = Session(engine)
        db.execute(text("SELECT 1"))
        db.close()
        return {
            "status": "healthy",
            "database": "connected",
            "timestamp": datetime.utcnow()
        }
    except Exception as e:
        logger.error(f"Health check failed: {str(e)}")
        raise HTTPException(status_code=503, detail="Service unavailable")

# Ready check endpoint
@app.get("/ready")
async def ready_check():
    """Readiness check endpoint"""
    try:
        from sqlalchemy import text
        db = Session(engine)
        db.execute(text("SELECT 1"))
        db.close()
        return {
            "ready": True,
            "timestamp": datetime.utcnow()
        }
    except Exception as e:
        logger.error(f"Ready check failed: {str(e)}")
        raise HTTPException(status_code=503, detail="Service not ready")

# API v1 routes
app.include_router(auth.router, prefix="/api/v1/auth", tags=["Authentication"])
app.include_router(users.router, prefix="/api/v1/users", tags=["Users"])
app.include_router(surveys.router, prefix="/api/v1/surveys", tags=["Surveys"])
app.include_router(monitoring_sites.router, prefix="/api/v1/monitoring-sites", tags=["Monitoring Sites"])
app.include_router(devices.router, prefix="/api/v1/devices", tags=["Devices"])
app.include_router(observations.router, prefix="/api/v1/observations", tags=["Observations"])
app.include_router(species.router, prefix="/api/v1/species", tags=["Species"])

# Phase 2: AI Analysis
app.include_router(image_analysis.router, prefix="/api/v1/image-analysis", tags=["Image Analysis"])
app.include_router(audio_analysis.router, prefix="/api/v1/audio-analysis", tags=["Audio Analysis"])

# Phase 3: Intelligence
app.include_router(population.router, prefix="/api/v1/population", tags=["Population Intelligence"])
app.include_router(biodiversity.router, prefix="/api/v1/biodiversity", tags=["Biodiversity"])
app.include_router(habitat.router, prefix="/api/v1/habitat", tags=["Habitat"])
app.include_router(conservation.router, prefix="/api/v1/conservation", tags=["Conservation"])

# Phase 4: GIS & Reporting
app.include_router(gis.router, prefix="/api/v1/gis", tags=["GIS & Maps"])
app.include_router(reports.router, prefix="/api/v1/reports", tags=["Reports"])

# Admin
app.include_router(admin.router, prefix="/api/v1/admin", tags=["Administration"])

@app.on_event("startup")
async def startup_event():
    """Startup event"""
    logger.info("=" * 50)
    logger.info("Wildlife Population Intelligence System Starting")
    logger.info("=" * 50)
    logger.info("API Documentation: http://localhost:8000/docs")
    logger.info("ReDoc: http://localhost:8000/redoc")

@app.on_event("shutdown")
async def shutdown_event():
    """Shutdown event"""
    logger.info("=" * 50)
    logger.info("Wildlife Population Intelligence System Shutting Down")
    logger.info("=" * 50)

# Root endpoint
@app.get("/")
async def root():
    """Root endpoint"""
    return {
        "message": "Wildlife Population Intelligence System API",
        "version": "1.0.0",
        "docs": "/docs",
        "health": "/health"
    }

if __name__ == "__main__":
    import uvicorn
    uvicorn.run(
        "main:app",
        host="0.0.0.0",
        port=8000,
        reload=True,
        log_level="info"
    )
