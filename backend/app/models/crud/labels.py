from pydantic import BaseModel, Field, ConfigDict
from typing import Optional
from datetime import datetime


class LabelBase(BaseModel):
    name: str


class LabelCreate(LabelBase):
    pass


class LabelUpdate(BaseModel):
    name: Optional[str] = None


class Label(LabelBase):
    id: str
    created_at: datetime
    updated_at: datetime

    model_config = ConfigDict(
        populate_by_name=True,
        json_schema_extra={
            "example": {
                "id": "507f1f77bcf86cd799439017",
                "name": "Urgent",
                "created_at": "2024-01-01T00:00:00",
                "updated_at": "2024-01-01T00:00:00"
            }
        }
    )