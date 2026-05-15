from pydantic import BaseModel, Field, ConfigDict
from typing import Optional, List, Any
from datetime import datetime


# Role Models
class RoleBase(BaseModel):
    name: str
    description: Optional[str] = None
    permission_ids: Optional[List[str]] = []


class RoleCreate(RoleBase):
    status: str = 'active'


class RoleUpdate(BaseModel):
    name: Optional[str] = None
    description: Optional[str] = None
    permission_ids: Optional[List[str]] = None
    status: Optional[str] = None

class RoleWithPermissions(BaseModel):
    id: str
    name: str
    description: Optional[str] = None
    permission_ids: List[str] = []
    permissions: List[Any] = []
    status: str = 'active'
    created_at: datetime
    updated_at: datetime
    created_by: Optional[str] = None
    updated_by: Optional[str] = None


class Role(RoleBase):
    id: str
    status: str = 'active'
    created_at: datetime
    updated_at: datetime
    created_by: Optional[str] = None
    updated_by: Optional[str] = None

    model_config = ConfigDict(
        populate_by_name=True,
        json_schema_extra={
            "example": {
                "id": "507f1f77bcf86cd799439013",
                "name": "Admin",
                "description": "",
                "created_at": "2024-01-01T00:00:00",
                "updated_at": "2024-01-01T00:00:00"
            }
        }
    )

