from pydantic import BaseModel
from typing import Optional, List
from datetime import datetime

from ..uploads.files import AttachmentFile


class DocumentPageCreate(BaseModel):
    title: str
    content_html: str = ''
    attachments: List[AttachmentFile] = []
    order_index: int = 0


class DocumentPageUpdate(BaseModel):
    title: Optional[str] = None
    content_html: Optional[str] = None
    attachments: Optional[List[AttachmentFile]] = None
    order_index: Optional[int] = None


class DocumentPageSummary(BaseModel):
    id: str
    url_param_id: str
    project_document_id: str
    title: str
    content_summary: Optional[str] = None
    order_index: int
    status: str
    created_at: datetime
    updated_at: datetime


class DocumentPageResponse(BaseModel):
    id: str
    url_param_id: str
    project_document_id: str
    title: str
    content_html: str
    content_summary: Optional[str] = None
    attachments: List[AttachmentFile] = []
    order_index: int
    status: str
    created_at: datetime
    updated_at: datetime
    created_by: Optional[str] = None
    updated_by: Optional[str] = None
