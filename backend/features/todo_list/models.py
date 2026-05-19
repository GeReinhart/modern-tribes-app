from pydantic import BaseModel
from typing import Optional
from datetime import datetime


class TodoItemCreate(BaseModel):
    feature_instance_id: str
    title: str
    position: int = 0


class TodoItemUpdate(BaseModel):
    title: Optional[str] = None
    status: Optional[str] = None
    position: Optional[int] = None
    document_content_html: Optional[str] = None


class TodoItemResponse(BaseModel):
    id: str
    feature_instance_id: str
    title: str
    status: str
    document_id: Optional[str] = None
    document_content_html: Optional[str] = None
    position: int
    created_at: datetime
    updated_at: datetime
    created_by: Optional[str] = None
    updated_by: Optional[str] = None
