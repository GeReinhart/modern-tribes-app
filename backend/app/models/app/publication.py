from pydantic import BaseModel
from typing import Optional, List
from datetime import datetime

from .project_document import LabelInfo
from .document_page import DocumentPageResponse
from ..uploads.files import AttachmentFile


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
