from fastapi import APIRouter, Depends, HTTPException
from sqlalchemy.orm import Session

from app.database.connection import get_db
from app.models.user import User
from app.schemas.user_schema import UserCreate, UserLogin
from app.services.user_service import create_user, login_user

router = APIRouter(
    prefix="/users",
    tags=["Users"]
)


@router.post("/register")
def register_user(
    user: UserCreate,
    db: Session = Depends(get_db)
):

    created_user = create_user(db, user)

    if created_user is None:

        existing_user = db.query(User).filter(
            User.email == user.email
        ).first()

        if existing_user:
            raise HTTPException(
                status_code=400,
                detail="Email already exists"
            )

        raise HTTPException(
            status_code=400,
            detail="Invalid role"
        )

    return {
        "message": "User registered successfully",
        "user_id": created_user.id,
        "role": created_user.role
    }


@router.post("/login")
def login(
    user: UserLogin,
    db: Session = Depends(get_db)
):

    token = login_user(
        db,
        user.email,
        user.password
    )

    if token is None:
        raise HTTPException(
            status_code=401,
            detail="Invalid Email or Password"
        )

    return {
        "access_token": token,
        "token_type": "bearer"
    }