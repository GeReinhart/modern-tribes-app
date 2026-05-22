from pydantic import BaseModel
from typing import Optional
from datetime import date


class KanbanLabel(BaseModel):
    id: str
    name: str
    color: str
    position: int


class KanbanColumnResponse(BaseModel):
    id: str
    name: str
    position: int


class KanbanCardResponse(BaseModel):
    id: str
    feature_instance_id: str
    column_id: str
    title: str
    assigned_person_id: Optional[str] = None
    assigned_person_name: Optional[str] = None
    document_id: Optional[str] = None
    document_content_html: Optional[str] = None
    position: int
    status: str
    size: Optional[int] = None
    due_date: Optional[date] = None
    label_ids: list[str] = []


class KanbanBoard(BaseModel):
    columns: list[KanbanColumnResponse]
    cards: list[KanbanCardResponse]
    labels: list[KanbanLabel]


class PersonOption(BaseModel):
    id: str
    name: str


class ColumnCreate(BaseModel):
    feature_instance_id: str
    name: str


class ColumnUpdate(BaseModel):
    name: str


class CardCreate(BaseModel):
    feature_instance_id: str
    column_id: str
    title: str
    assigned_person_id: Optional[str] = None
    position: int = 0


class CardUpdate(BaseModel):
    title: Optional[str] = None
    assigned_person_id: Optional[str] = None
    clear_assignee: bool = False
    document_content_html: Optional[str] = None
    size: Optional[int] = None
    clear_size: bool = False
    due_date: Optional[date] = None
    clear_due_date: bool = False


class MoveCard(BaseModel):
    direction: str  # "prev" | "next"


class ReorderCard(BaseModel):
    direction: str  # "up" | "down" | "top" | "bottom"


class LabelCreate(BaseModel):
    feature_instance_id: str
    name: str
    color: str = '#6b7280'


class LabelUpdate(BaseModel):
    name: Optional[str] = None
    color: Optional[str] = None
