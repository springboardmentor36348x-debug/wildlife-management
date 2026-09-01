import sys
import os

from fastapi import FastAPI, Depends, HTTPException, status
from fastapi.middleware.cors import CORSMiddleware
from sqlalchemy.orm import Session
from sqlalchemy import or_

from database import engine, Base, get_db
import models
import schemas

# Extend models package path so PyTorch unpickler finds yolov9 submodules (models.yolo, models.common)
YOLOV9_REPO_PATH = os.path.join(os.path.dirname(__file__), "yolov9_repo")
if YOLOV9_REPO_PATH not in sys.path:
    sys.path.insert(0, YOLOV9_REPO_PATH)

yolov9_models_dir = os.path.join(YOLOV9_REPO_PATH, "models")
if os.path.exists(yolov9_models_dir):
    if not hasattr(models, "__path__") or not models.__path__:
        models.__path__ = [yolov9_models_dir]
    elif yolov9_models_dir not in models.__path__:
        models.__path__.append(yolov9_models_dir)

from auth import hash_password, verify_password, create_access_token, get_current_user, require_roles
import models_monitoring          
from routers.monitoring import router as monitoring_router   
from routers.detection import router as detection_router
from routers.audio import router as audio_router
from routers.intelligence import router as intelligence_router

Base.metadata.create_all(bind=engine)

app = FastAPI(title="Wildlife Population Intelligence System API")

app.add_middleware(
    CORSMiddleware,
    allow_origins=[
        "http://localhost:5173",
        "http://127.0.0.1:5173",
        "http://localhost:3000",
        "http://127.0.0.1:3000",
    ],
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)
app.include_router(monitoring_router) 
app.include_router(detection_router)
app.include_router(audio_router)
app.include_router(intelligence_router)

@app.get("/")
def read_root():
    return {"message": "Wildlife Population Intelligence System API is running"}


@app.post("/auth/register", response_model=schemas.UserOut)
def register(user: schemas.UserCreate, db: Session = Depends(get_db)):
    # Check if email or username already exists
    existing = (
        db.query(models.User)
        .filter(or_(models.User.email == user.email, models.User.username == user.username))
        .first()
    )
    if existing:
        raise HTTPException(status_code=400, detail="Email or username already registered")

    # If first user in DB or registering as Administrator, auto-approve so there is an admin available
    user_count = db.query(models.User).count()
    is_auto_approved = user_count == 0 or user.role == models.UserRole.admin

    new_user = models.User(
        full_name=user.full_name,
        username=user.username,
        email=user.email,
        phone_number=user.phone_number,
        country=user.country,
        hashed_password=hash_password(user.password),
        role=user.role,
        is_approved=is_auto_approved,
    )
    db.add(new_user)
    db.commit()
    db.refresh(new_user)
    return new_user


@app.post("/auth/login", response_model=schemas.TokenResponse)
def login(credentials: schemas.LoginRequest, db: Session = Depends(get_db)):
    user = db.query(models.User).filter(models.User.email == credentials.email).first()

    if not user or not verify_password(credentials.password, user.hashed_password):
        raise HTTPException(status_code=401, detail="Invalid email or password")

    if not user.is_approved:
        raise HTTPException(
            status_code=status.HTTP_403_FORBIDDEN,
            detail="Your account is pending approval from an Administrator."
        )

    access_token = create_access_token(
        data={"sub": str(user.id), "role": user.role.value}
    )

    return {
        "access_token": access_token,
        "token_type": "bearer",
        "user": user,
    }


@app.get("/auth/me", response_model=schemas.UserOut)
def get_me(current_user: models.User = Depends(get_current_user)):
    return current_user


# --- Admin User Management Endpoints ---

@app.get("/admin/users", response_model=list[schemas.UserOut])
def list_all_users(
    db: Session = Depends(get_db),
    admin_user: models.User = Depends(require_roles([models.UserRole.admin]))
):
    """List all registered users (Admin only)"""
    return db.query(models.User).order_by(models.User.created_at.desc()).all()


@app.put("/admin/users/{user_id}/approve", response_model=schemas.UserOut)
def approve_user(
    user_id: int,
    approval_data: schemas.UserApprovalUpdate,
    db: Session = Depends(get_db),
    admin_user: models.User = Depends(require_roles([models.UserRole.admin]))
):
    """Approve or reject a user (Admin only)"""
    target_user = db.query(models.User).filter(models.User.id == user_id).first()
    if not target_user:
        raise HTTPException(status_code=404, detail="User not found")
    
    target_user.is_approved = approval_data.is_approved
    db.commit()
    db.refresh(target_user)
    return target_user


@app.put("/admin/users/{user_id}/role", response_model=schemas.UserOut)
def change_user_role(
    user_id: int,
    role_data: schemas.UserRoleUpdate,
    db: Session = Depends(get_db),
    admin_user: models.User = Depends(require_roles([models.UserRole.admin]))
):
    """Change a user's role (Admin only)"""
    target_user = db.query(models.User).filter(models.User.id == user_id).first()
    if not target_user:
        raise HTTPException(status_code=404, detail="User not found")
    
    target_user.role = role_data.role
    db.commit()
    db.refresh(target_user)
    return target_user