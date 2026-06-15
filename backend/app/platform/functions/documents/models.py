from datetime import datetime
from typing import Optional

from pydantic import BaseModel, Field


class DocumentBase(BaseModel):
    content_html: str = Field(..., min_length=1, description="Post content in HTML")


class DocumentCreate(DocumentBase):
    status: str = "active"


class DocumentUpdate(BaseModel):
    content_html: Optional[str] = Field(None, min_length=1, description="Post content in HTML")
    status: Optional[str] = None


class Document(DocumentBase):
    id: str
    status: str = "active"
    content_summary: Optional[str] = None
    created_at: datetime
    updated_at: datetime
    created_by: Optional[str] = None
    updated_by: Optional[str] = None
