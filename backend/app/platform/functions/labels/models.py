from datetime import datetime
from typing import Optional

from pydantic import BaseModel, ConfigDict


class LabelInfo(BaseModel):
    id: str
    name: str


class LabelBase(BaseModel):
    name: str


class LabelCreate(LabelBase):
    status: str = "active"


class LabelUpdate(BaseModel):
    name: Optional[str] = None
    status: Optional[str] = None


class Label(LabelBase):
    id: str
    status: str = "active"
    created_at: datetime
    updated_at: datetime
    created_by: Optional[str] = None
    updated_by: Optional[str] = None

    model_config = ConfigDict(
        populate_by_name=True,
        json_schema_extra={
            "example": {
                "id": "507f1f77bcf86cd799439017",
                "name": "Urgent",
                "created_at": "2024-01-01T00:00:00",
                "updated_at": "2024-01-01T00:00:00",
            }
        },
    )


class FeatureLabel(BaseModel):
    id: str
    name: str
    color: str
    position: int


class FeatureLabelCreate(BaseModel):
    feature_instance_id: str
    name: str
    color: str = '#6b7280'


class FeatureLabelUpdate(BaseModel):
    name: Optional[str] = None
    color: Optional[str] = None
    status: Optional[str] = None


class FeatureLabelsReorderRequest(BaseModel):
    feature_instance_id: str
    ordered_ids: list[str]
