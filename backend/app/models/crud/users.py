from datetime import datetime
from typing import List, Optional

from pydantic import BaseModel, ConfigDict, EmailStr

from app.models.auth.auth import UserSession
from app.models.crud.roles import Role


# User Models
class UserBase(BaseModel):
    login: str
    email: EmailStr
    role_ids: Optional[List[str]] = []
    person_id: Optional[str] = None
    sessions: List[UserSession] = []

class UserCreate(UserBase):
    status: str = 'active'


class UserUpdate(BaseModel):
    login: Optional[str] = None
    email: Optional[EmailStr] = None
    role_ids: Optional[List[str]] = None
    person_id: Optional[str] = None
    sessions: List[UserSession] = []
    status: Optional[str] = None


class User(UserBase):
    id: str
    url_param_id: str
    status: str = 'active'
    created_at: datetime
    updated_at: datetime
    created_by: Optional[str] = None
    updated_by: Optional[str] = None
    sessions: List[UserSession] = []

    model_config = ConfigDict(
        populate_by_name=True,
        json_schema_extra={
            "example": {
                "id": "507f1f77-bcf8-6cd7-9943-9014abcd1234",
                "login": "Alain",
                "role_ids": ["507f1f77-bcf8-6cd7-9943-9012abcd1234"],
                "created_at": "2024-01-01T00:00:00",
                "updated_at": "2024-01-01T00:00:00"
            }
        }
    )


class UserSearchResult(BaseModel):
    id: str
    url_param_id: str
    login: str
    email: str
    full_name: str


class UserWithRoles(User):
    roles: Optional[List[Role]] = []
    permissions: Optional[List[str]] = []


class UserWithPermissions(User):
    permissions: Optional[List[str]] = []

    def has_permission(self, permission: str) -> bool:
        """Check if user has a specific permission"""
        return permission in self.permissions

    def has_any_permission(self, permissions: List[str]) -> bool:
        """Check if user has any of the specified permissions"""
        user_perms = set(self.permissions)
        return bool(user_perms.intersection(set(permissions)))

    def has_all_permissions(self, permissions: List[str]) -> bool:
        """Check if user has all specified permissions"""
        user_perms = set(self.permissions)
        return set(permissions).issubset(user_perms)