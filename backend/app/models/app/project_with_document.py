from datetime import datetime
from typing import List, Optional

from pydantic import BaseModel

from app.models.uploads.files import AttachmentFile


class ProjectWithDocumentCreate(BaseModel):
    tribe_id: str
    name: str
    document_content_html: str
    document_attachments: List[AttachmentFile] = []


class ProjectWithDocumentUpdate(BaseModel):
    name: Optional[str] = None
    document_content_html: Optional[str] = None
    document_attachments: Optional[List[AttachmentFile]] = None


class ProjectWithDocumentResponse(BaseModel):
    id: str
    url_param_id: str
    name: str
    document_id: Optional[str] = None
    document_content_html: str
    document_attachments: List[AttachmentFile] = []
    status: str
    created_at: datetime
    updated_at: datetime
