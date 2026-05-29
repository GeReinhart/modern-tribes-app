from datetime import datetime
from typing import Optional

from pydantic import BaseModel, ConfigDict


class ProjectBase(BaseModel):
    name: str
    document_id: Optional[str] = None


class ProjectCreate(ProjectBase):
    status: str = "active"


class ProjectUpdate(BaseModel):
    name: Optional[str] = None
    document_id: Optional[str] = None
    status: Optional[str] = None


class Project(ProjectBase):
    id: str
    url_param_id: str
    status: str = "active"
    created_at: datetime
    updated_at: datetime
    created_by: Optional[str] = None
    updated_by: Optional[str] = None

    model_config = ConfigDict(
        populate_by_name=True,
        json_schema_extra={
            "example": {
                "id": "507f1f77bcf86cd799439019",
                "name": "Website Redesign",
                "document_id": "507f1f77bcf86cd799439016",
                "created_at": "2024-01-01T00:00:00",
                "updated_at": "2024-01-01T00:00:00",
            }
        },
    )
