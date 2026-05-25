from datetime import datetime
from enum import Enum
from typing import Optional

from pydantic import BaseModel, ConfigDict


class Gender(str, Enum):
    MALE = "male"
    FEMALE = "female"
    OTHER = "other"
    PREFER_NOT_TO_SAY = "prefer_not_to_say"


class PersonBase(BaseModel):
    first_name: str
    last_name: str
    gender: Gender
    document_id: Optional[str] = None


class PersonCreate(PersonBase):
    status: str = 'active'


class PersonUpdate(BaseModel):
    first_name: Optional[str] = None
    last_name: Optional[str] = None
    gender: Optional[Gender] = None
    document_id: Optional[str] = None
    status: Optional[str] = None


class Person(PersonBase):
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
                "id": "507f1f77bcf86cd799439014",
                "first_name": "John",
                "last_name": "Doe",
                "gender": "male",
                "document_id": "507f1f77bcf86cd799439016",
                "created_at": "2024-01-01T00:00:00",
                "updated_at": "2024-01-01T00:00:00"
            }
        }
    )