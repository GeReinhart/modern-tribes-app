from fastapi import APIRouter, Depends, HTTPException, status
from uuid import UUID

from app.routers.auth.authentification import get_current_user
from app.routers.auth.authorization import require_any_permission_decorator
from app.models.auth.auth import PermissionEnum
from app.core.database import get_database
from app.utils.project_access import check_project_access_or_admin
from app.utils.document_helpers import strip_html, extract_content_summary
from app.repositories import todo_repository, persons_repository
from .models import (
    TodoItemCreate, TodoItemUpdate, TodoItemResponse,
    TodoLabel, TodoLabelCreate, TodoLabelUpdate, PersonOption,
)

router = APIRouter(prefix="/todo-items", tags=["feature_todo_list"])
label_router = APIRouter(prefix="/todo-labels", tags=["feature_todo_list"])


async def _get_project_id(conn, feature_instance_id: str) -> str:
    row = await conn.fetchrow(
        "SELECT project_id FROM projects_features WHERE id = $1", UUID(feature_instance_id)
    )
    if not row:
        raise HTTPException(status_code=status.HTTP_404_NOT_FOUND, detail="Feature instance not found.")
    return str(row["project_id"])


def _row_to_todo(row: dict) -> TodoItemResponse:
    return TodoItemResponse(
        id=str(row["id"]),
        feature_instance_id=str(row["feature_instance_id"]),
        title=row["title"],
        status=row["status"],
        todo_status=row["todo_status"],
        document_id=str(row["document_id"]) if row.get("document_id") else None,
        document_content_html=row.get("document_content_html"),
        position=row["position"],
        size=row.get("size"),
        due_date=row.get("due_date"),
        assigned_person_id=str(row["assigned_person_id"]) if row.get("assigned_person_id") else None,
        assigned_person_name=row.get("assigned_person_name"),
        label_ids=list(row.get("label_ids") or []),
        created_at=row["created_at"],
        updated_at=row["updated_at"],
        created_by=str(row["created_by"]) if row.get("created_by") else None,
        updated_by=str(row["updated_by"]) if row.get("updated_by") else None,
    )


@router.get("/by-instance/{feature_instance_id}", response_model=list[TodoItemResponse])
@require_any_permission_decorator(PermissionEnum.ADMIN, PermissionEnum.CAN_ACCESS_OWN_TRIBES)
async def list_todo_items(feature_instance_id: str, current_user: dict = Depends(get_current_user)):
    pool = get_database()
    async with pool.acquire() as conn:
        project_id = await _get_project_id(conn, feature_instance_id)
    await check_project_access_or_admin(project_id, current_user, pool, min_position='guest')
    rows = await todo_repository.fetch_todo_items(pool, feature_instance_id)
    return [_row_to_todo(r) for r in rows]


@router.get("/persons/{feature_instance_id}", response_model=list[PersonOption])
@require_any_permission_decorator(PermissionEnum.ADMIN, PermissionEnum.CAN_ACCESS_OWN_TRIBES)
async def list_persons(feature_instance_id: str, current_user: dict = Depends(get_current_user)):
    pool = get_database()
    async with pool.acquire() as conn:
        project_id = await _get_project_id(conn, feature_instance_id)
    await check_project_access_or_admin(project_id, current_user, pool, min_position='guest')
    rows = await persons_repository.fetch_persons_for_feature(pool, feature_instance_id)
    return [PersonOption(**r) for r in rows]


@router.post("/", response_model=TodoItemResponse, status_code=status.HTTP_201_CREATED)
@require_any_permission_decorator(PermissionEnum.ADMIN, PermissionEnum.CAN_ACCESS_OWN_TRIBES)
async def create_todo_item(data: TodoItemCreate, current_user: dict = Depends(get_current_user)):
    pool = get_database()
    user_id = str(current_user["id"])
    async with pool.acquire() as conn:
        project_id = await _get_project_id(conn, data.feature_instance_id)
    await check_project_access_or_admin(project_id, current_user, pool, min_position='member')
    row = await todo_repository.insert_todo_item(pool, data.feature_instance_id, data.title, data.position, user_id)
    return _row_to_todo(row)


@router.patch("/{item_id}", response_model=TodoItemResponse)
@require_any_permission_decorator(PermissionEnum.ADMIN, PermissionEnum.CAN_ACCESS_OWN_TRIBES)
async def update_todo_item(item_id: str, data: TodoItemUpdate, current_user: dict = Depends(get_current_user)):
    pool = get_database()
    user_id = str(current_user["id"])
    async with pool.acquire() as conn:
        item_row = await conn.fetchrow("SELECT feature_instance_id FROM todo_items WHERE id = $1", UUID(item_id))
        if not item_row:
            raise HTTPException(status_code=status.HTTP_404_NOT_FOUND, detail="Todo item not found.")
        project_id = await _get_project_id(conn, str(item_row["feature_instance_id"]))
    await check_project_access_or_admin(project_id, current_user, pool, min_position='member')

    basic: dict = {}
    if data.title is not None:
        basic["title"] = data.title
    if data.status is not None:
        basic["status"] = data.status
    if data.todo_status is not None:
        basic["todo_status"] = data.todo_status
    if data.position is not None:
        basic["position"] = data.position
    await todo_repository.update_todo_item_basic(pool, item_id, basic, user_id)

    if data.size is not None or data.clear_size or data.assigned_person_id is not None or data.clear_assignee or data.due_date is not None or data.clear_due_date:
        await todo_repository.update_todo_fields(
            pool, item_id, data.size, data.clear_size, data.assigned_person_id, data.clear_assignee, data.due_date, data.clear_due_date, user_id,
        )

    if data.document_content_html is not None:
        await todo_repository.upsert_document(
            pool, item_id,
            data.document_content_html,
            strip_html(data.document_content_html),
            extract_content_summary(data.document_content_html),
            user_id,
        )

    row = await todo_repository.fetch_todo_item(pool, item_id)
    return _row_to_todo(row)


@router.post("/{item_id}/labels/{label_id}", response_model=list[str])
@require_any_permission_decorator(PermissionEnum.ADMIN, PermissionEnum.CAN_ACCESS_OWN_TRIBES)
async def toggle_todo_label(item_id: str, label_id: str, current_user: dict = Depends(get_current_user)):
    pool = get_database()
    async with pool.acquire() as conn:
        item_row = await conn.fetchrow("SELECT feature_instance_id FROM todo_items WHERE id = $1", UUID(item_id))
        if not item_row:
            raise HTTPException(status_code=status.HTTP_404_NOT_FOUND, detail="Todo item not found.")
        project_id = await _get_project_id(conn, str(item_row["feature_instance_id"]))
    await check_project_access_or_admin(project_id, current_user, pool, min_position='member')
    return await todo_repository.toggle_item_label(pool, item_id, label_id)


@router.delete("/{item_id}", status_code=status.HTTP_204_NO_CONTENT)
@require_any_permission_decorator(PermissionEnum.ADMIN, PermissionEnum.CAN_ACCESS_OWN_TRIBES)
async def delete_todo_item(item_id: str, current_user: dict = Depends(get_current_user)):
    pool = get_database()
    async with pool.acquire() as conn:
        item_row = await conn.fetchrow("SELECT feature_instance_id FROM todo_items WHERE id = $1", UUID(item_id))
        if not item_row:
            raise HTTPException(status_code=status.HTTP_404_NOT_FOUND, detail="Todo item not found.")
        project_id = await _get_project_id(conn, str(item_row["feature_instance_id"]))
    await check_project_access_or_admin(project_id, current_user, pool, min_position='member')
    async with pool.acquire() as conn:
        await conn.execute("DELETE FROM todo_items WHERE id = $1", UUID(item_id))


# --- Label endpoints ---

@label_router.get("/by-instance/{feature_instance_id}", response_model=list[TodoLabel])
@require_any_permission_decorator(PermissionEnum.ADMIN, PermissionEnum.CAN_ACCESS_OWN_TRIBES)
async def list_labels(feature_instance_id: str, current_user: dict = Depends(get_current_user)):
    pool = get_database()
    async with pool.acquire() as conn:
        project_id = await _get_project_id(conn, feature_instance_id)
    await check_project_access_or_admin(project_id, current_user, pool, min_position='guest')
    rows = await todo_repository.fetch_labels(pool, feature_instance_id)
    return [TodoLabel(**r) for r in rows]


@label_router.post("/", response_model=TodoLabel, status_code=status.HTTP_201_CREATED)
@require_any_permission_decorator(PermissionEnum.ADMIN, PermissionEnum.CAN_ACCESS_OWN_TRIBES)
async def create_label(data: TodoLabelCreate, current_user: dict = Depends(get_current_user)):
    pool = get_database()
    user_id = str(current_user["id"])
    async with pool.acquire() as conn:
        project_id = await _get_project_id(conn, data.feature_instance_id)
    await check_project_access_or_admin(project_id, current_user, pool, min_position='manager')
    row = await todo_repository.insert_label(pool, data.feature_instance_id, data.name, data.color, user_id)
    return TodoLabel(**row)


@label_router.patch("/{label_id}", status_code=status.HTTP_204_NO_CONTENT)
@require_any_permission_decorator(PermissionEnum.ADMIN, PermissionEnum.CAN_ACCESS_OWN_TRIBES)
async def update_label(label_id: str, data: TodoLabelUpdate, current_user: dict = Depends(get_current_user)):
    pool = get_database()
    user_id = str(current_user["id"])
    async with pool.acquire() as conn:
        row = await conn.fetchrow(
            "SELECT tl.feature_instance_id FROM todo_labels tl WHERE tl.id = $1", UUID(label_id)
        )
        if not row:
            raise HTTPException(status_code=status.HTTP_404_NOT_FOUND, detail="Label not found.")
        project_id = await _get_project_id(conn, str(row["feature_instance_id"]))
    await check_project_access_or_admin(project_id, current_user, pool, min_position='manager')
    await todo_repository.update_label(pool, label_id, data.name, user_id)


@label_router.delete("/{label_id}", status_code=status.HTTP_204_NO_CONTENT)
@require_any_permission_decorator(PermissionEnum.ADMIN, PermissionEnum.CAN_ACCESS_OWN_TRIBES)
async def delete_label(label_id: str, current_user: dict = Depends(get_current_user)):
    pool = get_database()
    async with pool.acquire() as conn:
        row = await conn.fetchrow(
            "SELECT tl.feature_instance_id FROM todo_labels tl WHERE tl.id = $1", UUID(label_id)
        )
        if not row:
            raise HTTPException(status_code=status.HTTP_404_NOT_FOUND, detail="Label not found.")
        project_id = await _get_project_id(conn, str(row["feature_instance_id"]))
    await check_project_access_or_admin(project_id, current_user, pool, min_position='manager')
    await todo_repository.delete_label(pool, label_id)
