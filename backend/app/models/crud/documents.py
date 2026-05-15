from pydantic import BaseModel, Field, ConfigDict, HttpUrl
from typing import Optional, List
from datetime import datetime
from ..uploads.files import AttachmentFile


class DocumentBase(BaseModel):
    content_html: str = Field(..., min_length=1, description="Post content in HTML")
    attachments: List[AttachmentFile] = Field(default=[], description="File attachments")


class DocumentCreate(DocumentBase):
    status: str = 'active'


class DocumentUpdate(BaseModel):
    content_html: Optional[str] = Field(None, min_length=1, description="Post content in HTML")
    attachments: Optional[List[AttachmentFile]] = Field(None, description="File attachments")
    status: Optional[str] = None

class Document(DocumentBase):
    id: str
    status: str = 'active'
    content_summary: Optional[str] = None
    created_at: datetime
    updated_at: datetime
    created_by: Optional[str] = None
    updated_by: Optional[str] = None

