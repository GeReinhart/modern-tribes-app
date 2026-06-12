from datetime import date
from typing import Literal, Optional

from pydantic import BaseModel


class MyTaskLabel(BaseModel):
    id: str
    name: str
    color: str


class MyTaskBase(BaseModel):
    id: str
    title: str
    size: Optional[int] = None
    due_date: Optional[date] = None
    assigned_person_id: Optional[str] = None
    assigned_person_name: Optional[str] = None
    feature_instance_id: str
    feature_instance_name: str
    project_id: str
    project_url_param_id: Optional[str] = None
    project_name: str
    tribe_id: Optional[str] = None
    tribe_url_param_id: Optional[str] = None
    tribe_name: Optional[str] = None
    label_ids: list[str] = []
    labels: list[MyTaskLabel] = []
    document_content_html: Optional[str] = None


class MyKanbanTask(MyTaskBase):
    source: Literal["kanban"] = "kanban"
    column_id: str
    column_name: str


class MyTodoTask(MyTaskBase):
    source: Literal["todo"] = "todo"
    todo_status: str


class MyTasksResponse(BaseModel):
    kanban: list[MyKanbanTask]
    todo: list[MyTodoTask]


def to_kanban(row: dict) -> MyKanbanTask:
    return MyKanbanTask(
        **{k: row[k] for k in MyTaskBase.model_fields if k in row},
        column_id=row["column_id"],
        column_name=row["column_name"],
    )


def to_todo(row: dict) -> MyTodoTask:
    return MyTodoTask(
        **{k: row[k] for k in MyTaskBase.model_fields if k in row},
        todo_status=row["todo_status"],
    )
