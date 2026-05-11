from pydantic import BaseModel, Field, ConfigDict, EmailStr
from typing import Optional, List
from datetime import datetime


from enum import Enum

class PermissionEnum(str, Enum):
    ADMIN = "admin"
    CAN_CREATE_OWN_TRIBES = "can_create_own_tribes"
    CAN_ACCESS_OWN_TRIBES = "can_access_attached_tribes"
    CAN_MANAGE_OWN_PROFILE = "can_manage_own_profile"

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
    token_type: str = "bearer"
    user: "UserResponse"

class UserResponse(BaseModel):
    id: str
    email: EmailStr
    permissions: Optional[List[str]] = []
    created_at: datetime

class SessionResponse(BaseModel):
    session_id: str
    user_agent: Optional[str]
    created_at: datetime
    last_activity: datetime


class Authorization(BaseModel):
    authorized: bool
    message: str
