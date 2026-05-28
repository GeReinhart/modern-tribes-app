from datetime import datetime
from typing import List, Optional

from pydantic import BaseModel

from app.models.app.document_page import DocumentPageResponse
from app.models.app.project_document import LabelInfo
from app.models.uploads.files import AttachmentFile


class PublicationSummary(BaseModel):
    id: str
    url_param_id: str
    document_id: str
    project_document_id: str
    title: str
    content_summary: Optional[str] = None
    labels: List[LabelInfo] = []
    published_at: datetime


class PublicationDetail(BaseModel):
    id: str
    url_param_id: str
    document_id: str
    project_document_id: str
    title: str
    content_html: str
    content_summary: Optional[str] = None
    labels: List[LabelInfo] = []
    attachments: List[AttachmentFile] = []
    pages: List[DocumentPageResponse] = []
    toc_depth: int = 4
    published_at: datetime
    published_by_login: Optional[str] = None
    author_name: Optional[str] = None


class PublicationAdminItem(BaseModel):
    id: str
    url_param_id: str
    document_id: str
    project_document_id: str
    title: str
    content_summary: Optional[str] = None
    labels: List[LabelInfo] = []
    tribe_id: str
    tribe_name: str
    project_id: str
    project_name: str
    published_at: datetime
    published_by_login: Optional[str] = None
