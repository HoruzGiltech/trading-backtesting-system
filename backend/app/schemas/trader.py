from pydantic import BaseModel, EmailStr
from uuid import UUID

class TraderCreate(BaseModel):
    email: EmailStr
    password: str
    full_name: str

class TraderLogin(BaseModel):
    email: EmailStr
    password: str

class TraderOut(BaseModel):
    id: UUID
    email: EmailStr
    full_name: str

    class Config:
        from_attributes = True

class Token(BaseModel):
    access_token: str
    token_type: str = "bearer"