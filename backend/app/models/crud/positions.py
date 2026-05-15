from pydantic import BaseModel, Field, ConfigDict
from typing import Optional, List
from datetime import datetime
from enum import Enum


class PositionEnum(str, Enum):
    CHIEF = "chief"
    MEMBER = "member"
    GUEST = "guest"


class PositionBase(BaseModel):
    tribe_id: str
    person_id: str
    position: PositionEnum


class PositionCreate(PositionBase):
    pass

class PositionUpdate(BaseModel):
    tribe_id: Optional[str] = None
    person_id: Optional[str] = None
    position: PositionEnum


class Position(PositionBase):
    id: str
    created_at: datetime
    updated_at: datetime
    created_by: Optional[str] = None
    updated_by: Optional[str] = None

    model_config = ConfigDict(
        populate_by_name=True,
        json_schema_extra={
            "example": {
                "id": "507f1f77bcf86cd799439014",
                "tribe_ids": "507f1f77bcf86cd799439015",
                "person_id": "507f1f77bcf86cd799439016",
                "position": "chief",
                "created_at": "2024-01-01T00:00:00",
                "updated_at": "2024-01-01T00:00:00"
            }
        }
    )