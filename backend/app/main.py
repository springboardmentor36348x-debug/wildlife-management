from fastapi import FastAPI
from fastapi.middleware.cors import CORSMiddleware
from app.routers import auth,surveys

app = FastAPI(
    title="Wildlife Population Intelligence System - API",
    description="Authentication & Authorization with JWT & RBAC",
    version="1.0.0"
)

# Enable CORS for React Frontend
app.add_middleware(
    CORSMiddleware,
    allow_origins=["*"],
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

app.include_router(auth.router, prefix="/api/auth", tags=["Authentication"])
app.include_router(surveys.router, prefix="/api/monitoring", tags=["Wildlife Surveys & Monitoring"])

@app.get("/")
def root():
    return {"status": "Active", "module": "Authentication & Authorization Server"}