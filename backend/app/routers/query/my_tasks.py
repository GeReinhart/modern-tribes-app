from datetime import date
from typing import Literal, Optional

from fastapi import APIRouter, Depends
from pydantic import BaseModel

from app.core.database import get_database
from app.models.auth.auth import PermissionEnum
from app.repositories import my_tasks_repository as repo
from app.routers.auth.authentification import get_current_user
from app.routers.auth.authorization import require_any_permission_decorator

router = APIRouter(prefix="/my-tasks", tags=["query_my_tasks"])


class MyTaskLabel(BaseModel):
    id: str
    name: str
    color: str


class MyTaskBase(BaseModel):
    id: str
    title: str
    size: Optional[int] = None
    due_date: date
    assigned_person_id: Optional[str] = None
    assigned_person_name: Optional[str] = None
    feature_instance_id: str
    feature_instance_name: str
    project_id: str
    project_name: str
    tribe_id: Optional[str] = None
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


def _to_kanban(row: dict) -> MyKanbanTask:
    return MyKanbanTask(
        **{k: row[k] for k in MyTaskBase.model_fields if k in row},
        column_id=row["column_id"],
        column_name=row["column_name"],
    )


def _to_todo(row: dict) -> MyTodoTask:
    return MyTodoTask(
        **{k: row[k] for k in MyTaskBase.model_fields if k in row},
        todo_status=row["todo_status"],
    )


@router.get("", response_model=MyTasksResponse)
@require_any_permission_decorator(PermissionEnum.ADMIN, PermissionEnum.CAN_ACCESS_OWN_TRIBES)
async def get_my_tasks(
    tribe_id: Optional[str] = None,
    project_id: Optional[str] = None,
    person_id: Optional[str] = None,
    label_id: Optional[str] = None,
    current_user: dict = Depends(get_current_user),
):
    pool = get_database()
    user_id = current_user["id"]
    filters = {
        k: v
        for k, v in {
            "tribe_id": tribe_id,
            "project_id": project_id,
            "person_id": person_id,
            "label_id": label_id,
        }.items()
        if v is not None
    }
    kanban_rows, todo_rows = await _fetch_both(pool, user_id, filters)
    return MyTasksResponse(
        kanban=[_to_kanban(r) for r in kanban_rows],
        todo=[_to_todo(r) for r in todo_rows],
    )


async def _fetch_both(pool, user_id: str, filters: dict) -> tuple[list[dict], list[dict]]:
    kanban = await repo.fetch_my_tasks_kanban(pool, user_id, filters)
    todo = await repo.fetch_my_tasks_todo(pool, user_id, filters)
    return kanban, todo
