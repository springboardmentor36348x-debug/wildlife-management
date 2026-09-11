from fastapi import APIRouter, Depends, HTTPException, status
from sqlalchemy.orm import Session

from app.core.deps import get_current_user
from app.core.security import (
    hash_password, verify_password,
    create_access_token, create_refresh_token, decode_refresh_token,
)
from app.db.session import get_db
from app.models.user import User
from app.schemas.user import (
    UserCreate, UserOut, Token, LoginRequest, RefreshRequest, RefreshResponse,
)

router = APIRouter(prefix="/auth", tags=["Authentication"])


@router.post("/register", response_model=UserOut, status_code=status.HTTP_201_CREATED)
def register(payload: UserCreate, db: Session = Depends(get_db)):
    existing = db.query(User).filter(User.email == payload.email).first()
    if existing:
        raise HTTPException(status_code=400, detail="A user with this email already exists.")

    user = User(
        full_name=payload.full_name,
        email=payload.email,
        hashed_password=hash_password(payload.password),
        role=payload.role,
        organization=payload.organization,
    )
    db.add(user)
    db.commit()
    db.refresh(user)
    return user


@router.post("/login", response_model=Token)
def login(payload: LoginRequest, db: Session = Depends(get_db)):
    user = db.query(User).filter(User.email == payload.email).first()
    if not user or not verify_password(payload.password, user.hashed_password):
        raise HTTPException(status_code=401, detail="Incorrect email or password.")
    if not user.is_active:
        raise HTTPException(status_code=403, detail="This account has been deactivated.")

    access_token = create_access_token(subject=user.id, extra_claims={"role": user.role.value})
    refresh_token = create_refresh_token(subject=user.id)
    return Token(access_token=access_token, refresh_token=refresh_token, user=user)


@router.post("/refresh", response_model=RefreshResponse)
def refresh_access_token(payload: RefreshRequest, db: Session = Depends(get_db)):
    """
    Exchanges a still-valid refresh token for a brand new access token,
    without requiring the user to re-enter their password. This is what
    lets a researcher stay logged in through a multi-hour field session
    instead of being kicked out every 60 minutes.
    """
    token_data = decode_refresh_token(payload.refresh_token)
    if token_data is None or "sub" not in token_data:
        raise HTTPException(status_code=401, detail="Invalid or expired refresh token.")

    user = db.query(User).filter(User.id == token_data["sub"]).first()
    if user is None or not user.is_active:
        raise HTTPException(status_code=401, detail="Invalid or expired refresh token.")

    new_access_token = create_access_token(subject=user.id, extra_claims={"role": user.role.value})
    return RefreshResponse(access_token=new_access_token)


@router.get("/me", response_model=UserOut)
def read_current_user(current_user: User = Depends(get_current_user)):
    return current_user
