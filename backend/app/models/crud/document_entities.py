from pydantic import BaseModel, Field, ConfigDict, model_validator
from typing import Optional
from datetime import datetime


class DocumentEntityBase(BaseModel):
    document_id: str
    project_id: Optional[str] = None
    related_document_id: Optional[str] = None

    @model_validator(mode='after')
    def validate_at_least_one_relation(self):
        """Ensure at least one relation is provided"""
        if not any([self.project_id, self.related_document_id]):
            raise ValueError("At least one relation (project_id or related_document_id) must be provided")
        return self


class DocumentEntityCreate(DocumentEntityBase):
    pass


class DocumentEntityUpdate(BaseModel):
    document_id: Optional[str] = None
    project_id: Optional[str] = None
    related_document_id: Optional[str] = None


class DocumentEntity(DocumentEntityBase):
    id: str
    created_at: datetime
    updated_at: datetime

    model_config = ConfigDict(
        populate_by_name=True,
        json_schema_extra={
            "example": {
                "id": "507f1f77bcf86cd799439020",
                "document_id": "507f1f77bcf86cd799439016",
                "project_id": "507f1f77bcf86cd799439019",
                "related_document_id": None,
                "created_at": "2024-01-01T00:00:00",
                "updated_at": "2024-01-01T00:00:00"
            }
        }
    )