from pydantic import BaseModel, EmailStr, field_validator

# Roles a person can pick for themselves at /auth/register.
# "administrator" is intentionally excluded — admins must be promoted
# separately (e.g. directly in the DB) so the public API can't be used
# to create one.
PUBLIC_ROLES = {"wildlife_researcher", "conservation_officer", "forest_officer"}


class UserCreate(BaseModel):
    full_name: str
    email: EmailStr
    password: str
    role: str = "wildlife_researcher"

    @field_validator("role")
    @classmethod
    def validate_role(cls, value: str) -> str:
        if value not in PUBLIC_ROLES:
            raise ValueError(
                f"role must be one of {sorted(PUBLIC_ROLES)}"
            )
        return value


class UserUpdate(BaseModel):
    full_name: str | None = None


class UserLogin(BaseModel):
    email: EmailStr
    password: str


class UserResponse(BaseModel):
    id: str
    full_name: str
    email: EmailStr
    role: str
    is_active: bool

    class Config:
        from_attributes = True