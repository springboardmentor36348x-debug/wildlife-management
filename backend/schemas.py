from pydantic import BaseModel, EmailStr
from models import UserRole
from datetime import datetime


class UserCreate(BaseModel):
    full_name: str
    username: str
    email: EmailStr
    phone_number: str | None = None
    country: str | None = None
    password: str
    role: UserRole = UserRole.researcher


class UserOut(BaseModel):
    id: int
    full_name: str
    username: str
    email: EmailStr
    role: UserRole
    is_approved: bool
    created_at: datetime

    class Config:
        from_attributes = True

class UserApprovalUpdate(BaseModel):
    is_approved: bool

class UserRoleUpdate(BaseModel):
    role: UserRole


class LoginRequest(BaseModel):
    email: EmailStr
    password: str


class TokenResponse(BaseModel):
    access_token: str
    token_type: str = "bearer"
    user: UserOut