from pydantic import BaseModel
from typing import Optional
from datetime import datetime, date


class TodoItemCreate(BaseModel):
    feature_instance_id: str
    title: str
    position: int = 0


class TodoItemUpdate(BaseModel):
    title: Optional[str] = None
    status: Optional[str] = None
    todo_status: Optional[str] = None
    position: Optional[int] = None
    document_content_html: Optional[str] = None
    size: Optional[int] = None
    clear_size: bool = False
    assigned_person_id: Optional[str] = None
    clear_assignee: bool = False
    due_date: Optional[date] = None
    clear_due_date: bool = False


class TodoItemResponse(BaseModel):
    id: str
    feature_instance_id: str
    title: str
    status: str
    todo_status: str
    document_id: Optional[str] = None
    document_content_html: Optional[str] = None
    position: int
    size: Optional[int] = None
    due_date: Optional[date] = None
    assigned_person_id: Optional[str] = None
    assigned_person_name: Optional[str] = None
    label_ids: list[str] = []
    created_at: datetime
    updated_at: datetime
    created_by: Optional[str] = None
    updated_by: Optional[str] = None
