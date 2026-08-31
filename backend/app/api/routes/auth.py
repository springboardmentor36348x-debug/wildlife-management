from fastapi import APIRouter, Depends, HTTPException
from sqlalchemy.orm import Session
from fastapi.security import OAuth2PasswordRequestForm
from app.database import get_db
from app.models.user import User
from app.schemas.user import UserCreate, UserResponse, UserUpdate
from app.core.security import hash_password, verify_password, create_access_token
from app.api.deps import get_current_user
from app.core.permissions import require_role

router = APIRouter(prefix="/auth", tags=["Authentication"])


# ✅ REGISTER WITH ROLE SUPPORT
@router.post("/register", response_model=UserResponse)
def register(user_data: UserCreate, db: Session = Depends(get_db)):

    existing_user = db.query(User).filter(User.email == user_data.email).first()
    if existing_user:
        raise HTTPException(status_code=400, detail="Email already registered")

    new_user = User(
        full_name=user_data.full_name,
        email=user_data.email,
        hashed_password=hash_password(user_data.password),
        role=user_data.role
    )

    db.add(new_user)
    db.commit()
    db.refresh(new_user)

    return new_user


# ✅ LOGIN
@router.post("/login")
def login(
    form_data: OAuth2PasswordRequestForm = Depends(),
    db: Session = Depends(get_db)
):
    user = db.query(User).filter(User.email == form_data.username).first()

    if not user or not verify_password(form_data.password, user.hashed_password):
        raise HTTPException(status_code=401, detail="Invalid email or password")

    if not user.is_active:
        raise HTTPException(status_code=403, detail="This account has been deactivated.")

    access_token = create_access_token(
        data={"sub": user.id, "role": user.role}
    )

    return {"access_token": access_token, "token_type": "bearer"}


# ✅ GET PROFILE
@router.get("/me", response_model=UserResponse)
def get_my_profile(current_user: User = Depends(get_current_user)):
    return current_user


# ✅ UPDATE MY PROFILE
@router.put("/me", response_model=UserResponse)
def update_my_profile(
    update_data: UserUpdate,
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user)
):
    if update_data.full_name is not None:
        current_user.full_name = update_data.full_name

    db.commit()
    db.refresh(current_user)
    return current_user


# ✅ ADMIN TEST ROUTE
@router.get("/admin-only")
def admin_only_route(current_user: User = Depends(require_role("administrator"))):
    return {"message": "Welcome Admin ✅"}


# ✅ LIST USERS (ADMIN ONLY)
@router.get("/users", response_model=list[UserResponse])
def list_users(
    db: Session = Depends(get_db),
    current_user: User = Depends(require_role("administrator"))
):
    return db.query(User).all()


# ✅ DEACTIVATE A USER (ADMIN ONLY)
@router.patch("/users/{user_id}/deactivate", response_model=UserResponse)
def deactivate_user(
    user_id: str,
    db: Session = Depends(get_db),
    current_user: User = Depends(require_role("administrator"))
):
    target = db.query(User).filter(User.id == user_id).first()
    if not target:
        raise HTTPException(status_code=404, detail="User not found")

    target.is_active = False
    db.commit()
    db.refresh(target)
    return target


# ✅ REACTIVATE A USER (ADMIN ONLY)
@router.patch("/users/{user_id}/activate", response_model=UserResponse)
def activate_user(
    user_id: str,
    db: Session = Depends(get_db),
    current_user: User = Depends(require_role("administrator"))
):
    target = db.query(User).filter(User.id == user_id).first()
    if not target:
        raise HTTPException(status_code=404, detail="User not found")

    target.is_active = True
    db.commit()
    db.refresh(target)
    return target