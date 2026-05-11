from pydantic import BaseModel, Field, ConfigDict
from typing import Optional, List
from datetime import datetime


class TribeBase(BaseModel):
    name: str
    document_id: Optional[str] = None
    project_ids: Optional[List[str]] = []

class TribeCreate(TribeBase):
    pass


class TribeUpdate(BaseModel):
    name: Optional[str] = None
    document_id: Optional[str] = None
    project_ids: Optional[List[str]] = None


class Tribe(TribeBase):
    id: str
    created_at: datetime
    updated_at: datetime

    model_config = ConfigDict(
        populate_by_name=True,
        json_schema_extra={
            "example": {
                "id": "507f1f77-bcf8-6cd7-9943-9015abcd1234",
                "name": "Engineering",
                "document_id": "507f1f77-bcf8-6cd7-9943-9016abcd1234",
                "project_ids": ["507f1f77-bcf8-6cd7-9943-9015abcd1234"],
                "created_at": "2024-01-01T00:00:00",
                "updated_at": "2024-01-01T00:00:00"
            }
        }
    )