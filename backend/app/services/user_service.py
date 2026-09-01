from sqlalchemy.orm import Session

from app.models.user import User
from app.schemas.user_schema import UserCreate
from app.utils.security import (
    hash_password,
    verify_password,
    create_access_token
)


ALLOWED_ROLES = {
    "student",
    "research_officer",
    "forest_officer",
    "admin"
}


def create_user(db: Session, user: UserCreate):

    # Validate role
    if user.role not in ALLOWED_ROLES:
        return None

    # Check whether email already exists
    existing_user = db.query(User).filter(
        User.email == user.email
    ).first()

    if existing_user:
        return None

    # Create new user
    new_user = User(
        full_name=user.full_name,
        email=user.email,
        password=hash_password(user.password),
        role=user.role
    )

    db.add(new_user)
    db.commit()
    db.refresh(new_user)

    return new_user


def login_user(db: Session, email: str, password: str):

    user = db.query(User).filter(
        User.email == email
    ).first()

    if user is None:
        return None

    if not verify_password(password, user.password):
        return None

    # Include role inside JWT
    token = create_access_token(
        {
            "sub": user.email,
            "role": user.role
        }
    )

    return token