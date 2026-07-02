from pydantic import BaseModel
from typing import Optional
from datetime import date, datetime


class JournalBlockCreate(BaseModel):
    feature_instance_id: str
    date: date
    position: int
    content_html: str


class JournalBlockUpdate(BaseModel):
    content_html: Optional[str] = None


class JournalBlockReorder(BaseModel):
    feature_instance_id: str
    date: date
    ordered_ids: list[str]


class JournalBlockResponse(BaseModel):
    id: str
    feature_instance_id: str
    date: date
    document_id: Optional[str] = None
    position: int
    content_html: Optional[str] = None
    content_summary: Optional[str] = None
    label_ids: list[str] = []
    status: str
    created_at: datetime
    updated_at: datetime
    created_by: Optional[str] = None
    updated_by: Optional[str] = None


class JournalDaysResponse(BaseModel):
    dates: list[date]


class JournalBlockListResponse(BaseModel):
    blocks: list[JournalBlockResponse]


class JournalDashboardEntry(BaseModel):
    feature_instance_id: str
    feature_instance_name: str
    project_id: str
    project_name: str
    tribe_id: str
    block_count: int


class JournalDashboardResponse(BaseModel):
    journals: list[JournalDashboardEntry]


class JournalAccessibleDatesResponse(BaseModel):
    dates: list[date]
