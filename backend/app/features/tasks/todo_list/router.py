from fastapi import APIRouter, Depends, HTTPException, status
from uuid import UUID

from app.platform.core.authentication.router import get_current_user
from app.platform.core.authorization.router import require_any_permission_decorator
from app.platform.core.authorization.models import PermissionEnum
from app.platform.core.database import get_database
from app.platform.core.utils.document_helpers import strip_html, extract_content_summary
from app.features.tasks import label_service, reminder_service
from app.features.tasks.todo_list import repository as todo_repository
from app.platform.functions.labels import repository as labels_repo
from app.platform.functions.search import index_repository as search_index
from app.features.tasks.models import (
    PersonOption, FeatureLabel, FeatureLabelCreate, FeatureLabelUpdate,
    TaskReminderCreate, TaskReminderResponse,
)
from app.features.tasks.todo_list.models import (
    TodoItemCreate, TodoItemUpdate, TodoItemResponse,
)

router = APIRouter(prefix="/todo-items", tags=["features_tasks_todo_list"])
label_router = APIRouter(prefix="/todo-labels", tags=["features_tasks_todo_list"])


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
        force_on_dashboard=row.get("force_on_dashboard", False) or False,
        assigned_person_id=str(row["assigned_person_id"]) if row.get("assigned_person_id") else None,
        assigned_person_name=row.get("assigned_person_name"),
        label_ids=list(row.get("label_ids") or []),
        reminders=[TaskReminderResponse(**r) for r in (row.get("reminders") or [])],
        created_at=row["created_at"],
        updated_at=row["updated_at"],
        created_by=str(row["created_by"]) if row.get("created_by") else None,
        updated_by=str(row["updated_by"]) if row.get("updated_by") else None,
    )


@router.get("/by-instance/{feature_instance_id}", response_model=list[TodoItemResponse])
@require_any_permission_decorator(PermissionEnum.ADMIN, PermissionEnum.CAN_ACCESS_OWN_TRIBES)
async def list_todo_items(feature_instance_id: str, current_user: dict = Depends(get_current_user)):
    """List all todo items for a feature instance.

    **Permissions:** admin | can_access_attached_tribes
    **Feature access:** minimum position ≥ guest
    """
    pool = get_database()
    await label_service.require_feature_access(pool, feature_instance_id, current_user, "guest")
    rows = await todo_repository.fetch_todo_items(pool, feature_instance_id)
    return [_row_to_todo(r) for r in rows]


@router.get("/persons/{feature_instance_id}", response_model=list[PersonOption])
@require_any_permission_decorator(PermissionEnum.ADMIN, PermissionEnum.CAN_ACCESS_OWN_TRIBES)
async def list_persons(feature_instance_id: str, current_user: dict = Depends(get_current_user)):
    """List persons available for assignment in a todo feature instance.

    **Permissions:** admin | can_access_attached_tribes
    """
    return await label_service.list_persons_for_feature(get_database(), feature_instance_id, current_user)


@router.post("/", response_model=TodoItemResponse, status_code=status.HTTP_201_CREATED)
@require_any_permission_decorator(PermissionEnum.ADMIN, PermissionEnum.CAN_ACCESS_OWN_TRIBES)
async def create_todo_item(data: TodoItemCreate, current_user: dict = Depends(get_current_user)):
    """Create a new todo item.

    **Permissions:** admin | can_access_attached_tribes
    **Feature access:** minimum position ≥ member
    """
    pool = get_database()
    user_id = str(current_user["id"])
    await label_service.require_feature_access(pool, data.feature_instance_id, current_user, "member")
    row = await todo_repository.insert_todo_item(pool, data.feature_instance_id, data.title, data.position, user_id, data.force_on_dashboard)
    await search_index.index_todo_item(pool, str(row["id"]), user_id)
    return _row_to_todo(row)


@router.patch("/{item_id}", response_model=TodoItemResponse)
@require_any_permission_decorator(PermissionEnum.ADMIN, PermissionEnum.CAN_ACCESS_OWN_TRIBES)
async def update_todo_item(item_id: str, data: TodoItemUpdate, current_user: dict = Depends(get_current_user)):
    """Update a todo item's fields.

    **Permissions:** admin | can_access_attached_tribes
    **Feature access:** minimum position ≥ member
    """
    pool = get_database()
    user_id = str(current_user["id"])
    async with pool.acquire() as conn:
        item_row = await conn.fetchrow("SELECT feature_instance_id FROM todo_items WHERE id = $1", UUID(item_id))
    if not item_row:
        raise HTTPException(status_code=status.HTTP_404_NOT_FOUND, detail="Todo item not found.")
    await label_service.require_feature_access(pool, str(item_row["feature_instance_id"]), current_user, "member")

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

    if data.size is not None or data.clear_size or data.assigned_person_id is not None or data.clear_assignee or data.due_date is not None or data.clear_due_date or data.force_on_dashboard is not None:
        await todo_repository.update_todo_fields(
            pool, item_id, data.size, data.clear_size, data.assigned_person_id, data.clear_assignee, data.due_date, data.clear_due_date, data.force_on_dashboard, user_id,
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
    if row["status"] != "archived":
        await search_index.index_todo_item(pool, item_id, user_id)
    else:
        await search_index.archive_entity(pool, "todo_item", item_id, user_id)
    return _row_to_todo(row)


@router.post("/{item_id}/reminders", response_model=list[TaskReminderResponse])
@require_any_permission_decorator(PermissionEnum.ADMIN, PermissionEnum.CAN_ACCESS_OWN_TRIBES)
async def set_todo_reminders(item_id: str, data: list[TaskReminderCreate], current_user: dict = Depends(get_current_user)):
    """Set reminders for a todo item (replaces existing reminders).

    **Permissions:** admin | can_access_attached_tribes
    **Feature access:** minimum position ≥ member
    """
    pool = get_database()
    user_id = str(current_user["id"])
    async with pool.acquire() as conn:
        item_row = await conn.fetchrow("SELECT feature_instance_id FROM todo_items WHERE id = $1", UUID(item_id))
    if not item_row:
        raise HTTPException(status_code=status.HTTP_404_NOT_FOUND, detail="Todo item not found.")
    await label_service.require_feature_access(pool, str(item_row["feature_instance_id"]), current_user, "member")
    reminders_data = [{"remind_at": r.remind_at, "reminder_type": r.reminder_type} for r in data]
    result = await reminder_service.set_reminders(pool, "todo_item", item_id, reminders_data, user_id)
    return [TaskReminderResponse(**r) for r in result]


@router.post("/{item_id}/labels/{label_id}", response_model=list[str])
@require_any_permission_decorator(PermissionEnum.ADMIN, PermissionEnum.CAN_ACCESS_OWN_TRIBES)
async def toggle_todo_label(item_id: str, label_id: str, current_user: dict = Depends(get_current_user)):
    """Toggle a label on a todo item (add if absent, remove if present).

    **Permissions:** admin | can_access_attached_tribes
    **Feature access:** minimum position ≥ member
    """
    pool = get_database()
    async with pool.acquire() as conn:
        item_row = await conn.fetchrow("SELECT feature_instance_id FROM todo_items WHERE id = $1", UUID(item_id))
    if not item_row:
        raise HTTPException(status_code=status.HTTP_404_NOT_FOUND, detail="Todo item not found.")
    await label_service.require_feature_access(pool, str(item_row["feature_instance_id"]), current_user, "member")
    result = await labels_repo.toggle_entity_label(pool, item_id, 'todo_item', label_id)
    await search_index.index_todo_item(pool, item_id, str(current_user["id"]))
    return result


@router.delete("/{item_id}", status_code=status.HTTP_204_NO_CONTENT)
@require_any_permission_decorator(PermissionEnum.ADMIN, PermissionEnum.CAN_ACCESS_OWN_TRIBES)
async def delete_todo_item(item_id: str, current_user: dict = Depends(get_current_user)):
    """Delete a todo item.

    **Permissions:** admin | can_access_attached_tribes
    **Feature access:** minimum position ≥ member
    """
    pool = get_database()
    async with pool.acquire() as conn:
        item_row = await conn.fetchrow("SELECT feature_instance_id FROM todo_items WHERE id = $1", UUID(item_id))
    if not item_row:
        raise HTTPException(status_code=status.HTTP_404_NOT_FOUND, detail="Todo item not found.")
    await label_service.require_feature_access(pool, str(item_row["feature_instance_id"]), current_user, "member")
    async with pool.acquire() as conn:
        await conn.execute("DELETE FROM todo_items WHERE id = $1", UUID(item_id))


# --- Label endpoints ---

@label_router.get("/by-instance/{feature_instance_id}", response_model=list[FeatureLabel])
@require_any_permission_decorator(PermissionEnum.ADMIN, PermissionEnum.CAN_ACCESS_OWN_TRIBES)
async def list_labels(feature_instance_id: str, current_user: dict = Depends(get_current_user)):
    """List all labels for a todo feature instance.

    **Permissions:** admin | can_access_attached_tribes
    """
    return await label_service.list_feature_labels(get_database(), feature_instance_id, current_user)


@label_router.post("/", response_model=FeatureLabel, status_code=status.HTTP_201_CREATED)
@require_any_permission_decorator(PermissionEnum.ADMIN, PermissionEnum.CAN_ACCESS_OWN_TRIBES)
async def create_label(data: FeatureLabelCreate, current_user: dict = Depends(get_current_user)):
    """Create a new label for a todo feature instance.

    **Permissions:** admin | can_access_attached_tribes
    """
    return await label_service.create_feature_label(get_database(), data, current_user)


@label_router.patch("/{label_id}", response_model=FeatureLabel)
@require_any_permission_decorator(PermissionEnum.ADMIN, PermissionEnum.CAN_ACCESS_OWN_TRIBES)
async def update_label(label_id: str, data: FeatureLabelUpdate, current_user: dict = Depends(get_current_user)):
    """Update a todo label.

    **Permissions:** admin | can_access_attached_tribes
    """
    return await label_service.update_feature_label(get_database(), label_id, data, current_user)


@label_router.delete("/{label_id}", status_code=status.HTTP_204_NO_CONTENT)
@require_any_permission_decorator(PermissionEnum.ADMIN, PermissionEnum.CAN_ACCESS_OWN_TRIBES)
async def delete_label(label_id: str, current_user: dict = Depends(get_current_user)):
    """Delete a todo label.

    **Permissions:** admin | can_access_attached_tribes
    """
    await label_service.delete_feature_label(get_database(), label_id, current_user)
