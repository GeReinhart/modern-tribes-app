from pydantic import BaseModel, Field, ConfigDict
from typing import Optional, List, Any
from datetime import datetime


# Role Models
class RoleBase(BaseModel):
    name: str
    description: Optional[str] = None
    permission_ids: Optional[List[str]] = []


class RoleCreate(RoleBase):
    pass


class RoleUpdate(BaseModel):
    name: Optional[str] = None
    description: Optional[str] = None
    permission_ids: Optional[List[str]] = None

class RoleWithPermissions(BaseModel):
    id: str
    name: str
    description: Optional[str] = None
    permission_ids: List[str] = []
    permissions: List[Any] = []
    created_at: datetime
    updated_at: datetime


class Role(RoleBase):
    id: str
    created_at: datetime
    updated_at: datetime

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

