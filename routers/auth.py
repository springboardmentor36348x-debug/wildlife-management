"""
Authentication Router
"""

from fastapi import APIRouter, Depends, HTTPException, status
from sqlalchemy.orm import Session
from datetime import datetime

from database import get_db
from models import User, UserRole
from schemas.auth import UserRegister, UserLogin, Token, UserResponse
from security import SecurityService, get_current_active_user

router = APIRouter()


@router.post("/register", response_model=Token, status_code=status.HTTP_201_CREATED)
def register(user_in: UserRegister, db: Session = Depends(get_db)):
    """Register a new user and return JWT access token"""
    existing = db.query(User).filter(User.email == user_in.email).first()
    if existing:
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail="Email already registered in system"
        )

    hashed_pw = SecurityService.hash_password(user_in.password)
    user = User(
        name=user_in.name,
        email=user_in.email,
        hashed_password=hashed_pw,
        role=user_in.role or UserRole.WILDLIFE_RESEARCHER,
        organization=user_in.organization,
        phone=user_in.phone,
        is_active=True,
        is_verified=True
    )
    db.add(user)
    db.commit()
    db.refresh(user)

    token_info = SecurityService.create_access_token(
        user_id=user.id,
        email=user.email,
        scopes=[user.role.value]
    )

    return {
        "access_token": token_info["access_token"],
        "token_type": "bearer",
        "expires_in": token_info["expires_in"],
        "expires_at": token_info["expires_at"],
        "user_id": user.id,
        "email": user.email,
        "role": user.role.value,
        "name": user.name
    }


@router.post("/login", response_model=Token)
def login(user_in: UserLogin, db: Session = Depends(get_db)):
    """Authenticate user with email and password"""
    user = db.query(User).filter(User.email == user_in.email).first()
    if not user or not SecurityService.verify_password(user_in.password, user.hashed_password):
        raise HTTPException(
            status_code=status.HTTP_401_UNAUTHORIZED,
            detail="Incorrect email or password",
            headers={"WWW-Authenticate": "Bearer"}
        )

    if not user.is_active:
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail="Account is inactive or disabled"
        )

    token_info = SecurityService.create_access_token(
        user_id=user.id,
        email=user.email,
        scopes=[user.role.value]
    )

    return {
        "access_token": token_info["access_token"],
        "token_type": "bearer",
        "expires_in": token_info["expires_in"],
        "expires_at": token_info["expires_at"],
        "user_id": user.id,
        "email": user.email,
        "role": user.role.value,
        "name": user.name
    }


@router.get("/me", response_model=UserResponse)
def get_current_user_profile(current_user: User = Depends(get_current_active_user)):
    """Retrieve profile of authenticated user"""
    return current_user
