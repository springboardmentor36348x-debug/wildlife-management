from fastapi import APIRouter, HTTPException, status, Depends
from fastapi.security import OAuth2PasswordRequestForm
from pydantic import BaseModel, EmailStr
from app.security import (
    hash_password, 
    verify_password, 
    create_access_token, 
    get_current_user,
    require_roles
)

router = APIRouter()

# In-Memory User Storage (For Day 6 Authentication testing)
db_users = {}

# Allowed Roles as per Day 6 Specs
VALID_ROLES = ["researcher", "conservation", "forest", "administrator"]

class UserRegister(BaseModel):
    name: str
    email: str
    password: str
    role: str
    organization: str | None = None

class TokenResponse(BaseModel):
    access_token: str
    token_type: str
    user: dict

@router.post("/register", status_code=status.HTTP_201_CREATED)
def register(user: UserRegister):
    email_clean = user.email.lower().strip()
    
    if email_clean in db_users:
        raise HTTPException(status_code=400, detail="User already exists with this email.")
    
    if user.role.lower() not in VALID_ROLES:
        raise HTTPException(status_code=400, detail=f"Invalid role. Must be one of {VALID_ROLES}")

    db_users[email_clean] = {
        "name": user.name,
        "email": email_clean,
        "password": hash_password(user.password),
        "role": user.role.lower(),
        "organization": user.organization
    }
    return {"message": f"User {user.name} registered successfully as {user.role}!"}

# OAuth2 Standard Login (For Postman & Swagger Docs)
@router.post("/token", response_model=TokenResponse)
def login_for_access_token(form_data: OAuth2PasswordRequestForm = Depends()):
    email_clean = form_data.username.lower().strip()
    user = db_users.get(email_clean)

    if not user or not verify_password(form_data.password, user["password"]):
        raise HTTPException(
            status_code=status.HTTP_401_UNAUTHORIZED,
            detail="Incorrect email or password",
            headers={"WWW-Authenticate": "Bearer"},
        )

    access_token = create_access_token(
        data={"sub": user["email"], "role": user["role"], "name": user["name"]}
    )
    
    return {
        "access_token": access_token,
        "token_type": "bearer",
        "user": {
            "name": user["name"],
            "email": user["email"],
            "role": user["role"],
            "organization": user.get("organization")
        }
    }

# RBAC Test Endpoints
@router.get("/me")
def get_user_profile(current_user: dict = Depends(get_current_user)):
    return {"status": "authenticated", "user": current_user}

@router.get("/admin-only")
def admin_data(current_user: dict = Depends(require_roles(["administrator"]))):
    return {"message": "Welcome Administrator! You have full system access."}

@router.get("/field-access")
def field_data(current_user: dict = Depends(require_roles(["forest", "researcher", "conservation", "administrator"]))):
    return {"message": "Access granted to Wildlife Observations & Camera Trap feeds."}