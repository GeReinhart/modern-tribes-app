from pydantic import BaseModel, Field, ConfigDict, model_validator
from typing import Optional
from datetime import datetime


class LabelEntityBase(BaseModel):
    label_id: str
    person_id: Optional[str] = None
    project_id: Optional[str] = None
    document_id: Optional[str] = None

    @model_validator(mode='after')
    def validate_at_least_one_entity(self):
        """Ensure at least one entity reference is provided"""
        if not any([self.person_id, self.project_id, self.document_id]):
            raise ValueError("At least one entity reference (person_id, project_id, or document_id) must be provided")
        return self


class LabelEntityCreate(LabelEntityBase):
    pass


class LabelEntityUpdate(BaseModel):
    label_id: Optional[str] = None
    person_id: Optional[str] = None
    project_id: Optional[str] = None
    document_id: Optional[str] = None


class LabelEntity(LabelEntityBase):
    id: str
    created_at: datetime
    updated_at: datetime

    model_config = ConfigDict(
        populate_by_name=True,
        json_schema_extra={
            "example": {
                "id": "507f1f77bcf86cd799439018",
                "label_id": "507f1f77bcf86cd799439017",
                "person_id": "507f1f77bcf86cd799439014",
                "project_id": None,
                "document_id": None,
                "created_at": "2024-01-01T00:00:00",
                "updated_at": "2024-01-01T00:00:00"
            }
        }
    )