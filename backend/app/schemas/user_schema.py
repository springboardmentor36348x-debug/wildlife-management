from pydantic import BaseModel, EmailStr
from typing import Literal


class UserCreate(BaseModel):

    full_name: str

    email: EmailStr

    password: str

    role: Literal[
        "student",
        "research_officer",
        "forest_officer",
        "admin"
    ]


class UserLogin(BaseModel):

    email: EmailStr

    password: str
