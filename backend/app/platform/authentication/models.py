from datetime import datetime
from typing import List, Optional

from pydantic import BaseModel, EmailStr, Field


class UserSession(BaseModel):
    session_id: str
    user_agent: Optional[str] = None
    ip_address: Optional[str] = None
    created_at: datetime = Field(default_factory=datetime.utcnow)
    last_activity: datetime = Field(default_factory=datetime.utcnow)
    expires_at: datetime


class MagicLinkRequest(BaseModel):
    email: EmailStr


class MagicLinkResponse(BaseModel):
    message: str
    email: EmailStr


class TokenResponse(BaseModel):
    access_token: str
    refresh_token: str
    token_type: str = "bearer"
    user: "UserResponse"


class RefreshRequest(BaseModel):
    refresh_token: str


class RefreshResponse(BaseModel):
    access_token: str
    refresh_token: str
    token_type: str = "bearer"


class UserResponse(BaseModel):
    id: str
    email: EmailStr
    permissions: Optional[List[str]] = []
    created_at: datetime
    language: str = "en"


class SessionResponse(BaseModel):
    session_id: str
    user_agent: Optional[str]
    ip_address: Optional[str]
    created_at: datetime
    last_activity: datetime
    expires_at: datetime
