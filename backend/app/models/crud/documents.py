from pydantic import BaseModel, Field, ConfigDict, HttpUrl
from typing import Optional, List
from datetime import datetime
from ..uploads.files import AttachmentFile


class DocumentBase(BaseModel):
    content_html: str = Field(..., min_length=1, description="Post content in HTML")
    attachments: List[AttachmentFile] = Field(default=[], description="File attachments")


class DocumentCreate(DocumentBase):
    pass


class DocumentUpdate(BaseModel):
    content_html: Optional[str] = Field(None, min_length=1, description="Post content in HTML")
    attachments: Optional[List[AttachmentFile]] = Field(None, description="File attachments")

class Document(DocumentBase):
    id: str
    content_summary: Optional[str] = None
    created_at: datetime
    updated_at: datetime
    created_by: Optional[str] = None
    updated_by: Optional[str] = None

