from pydantic import BaseModel, Field
from typing import Optional, List
from datetime import datetime

from ..uploads.files import AttachmentFile


class LabelInfo(BaseModel):
    id: str
    name: str


class ProjectDocumentCreate(BaseModel):
    title: str = Field(..., min_length=1, max_length=255)
    content_html: str = Field(default='')
    attachments: List[AttachmentFile] = []
    label_names: List[str] = []


class ProjectDocumentUpdate(BaseModel):
    title: Optional[str] = Field(None, min_length=1, max_length=255)
    content_html: Optional[str] = None
    attachments: Optional[List[AttachmentFile]] = None
    label_names: Optional[List[str]] = None


class ProjectDocumentSummary(BaseModel):
    id: str
    url_param_id: str
    document_id: str
    title: str
    content_summary: Optional[str] = None
    labels: List[LabelInfo] = []
    status: str
    publication_url_param_id: Optional[str] = None
    created_at: datetime
    updated_at: datetime


class ProjectDocumentResponse(BaseModel):
    id: str
    url_param_id: str
    project_id: str
    document_id: str
    title: str
    content_html: str
    content_summary: Optional[str] = None
    attachments: List[AttachmentFile] = []
    labels: List[LabelInfo] = []
    status: str
    publication_url_param_id: Optional[str] = None
    created_at: datetime
    updated_at: datetime
    created_by: Optional[str] = None
    updated_by: Optional[str] = None


class ProjectDocumentLabel(BaseModel):
    id: str
    name: str
    usage_count: int
