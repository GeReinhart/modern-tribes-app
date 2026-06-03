from datetime import datetime
from typing import Optional

from pydantic import BaseModel, ConfigDict


class TribeBase(BaseModel):
    name: str
    document_id: Optional[str] = None
    theme_code: Optional[str] = None


class TribeCreate(TribeBase):
    status: str = "active"


class TribeUpdate(BaseModel):
    name: Optional[str] = None
    document_id: Optional[str] = None
    status: Optional[str] = None
    theme_code: Optional[str] = None


class Tribe(TribeBase):
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
                "id": "507f1f77-bcf8-6cd7-9943-9015abcd1234",
                "name": "Engineering",
                "document_id": "507f1f77-bcf8-6cd7-9943-9016abcd1234",
                "created_at": "2024-01-01T00:00:00",
                "updated_at": "2024-01-01T00:00:00",
            }
        },
    )
