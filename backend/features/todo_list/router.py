from fastapi import APIRouter, Depends, HTTPException, status
from uuid import UUID
from datetime import datetime, timezone

from app.routers.auth.authentification import get_current_user
from app.routers.auth.authorization import require_any_permission_decorator
from app.models.auth.auth import PermissionEnum
from app.core.database import get_database
from app.utils.project_access import check_project_access_or_admin
from app.utils.document_helpers import strip_html, extract_content_summary
from .models import TodoItemCreate, TodoItemUpdate, TodoItemResponse

router = APIRouter(prefix="/todo-items", tags=["feature_todo_list"])


async def _get_feature_instance_project(conn, feature_instance_id: str) -> str:
    row = await conn.fetchrow(
        "SELECT project_id FROM project_feature_instances WHERE id = $1",
        UUID(feature_instance_id)
    )
    if not row:
        raise HTTPException(status_code=status.HTTP_404_NOT_FOUND, detail="Feature instance not found.")
    return str(row["project_id"])


def _row_to_todo(row) -> TodoItemResponse:
    return TodoItemResponse(
        id=str(row["id"]),
        feature_instance_id=str(row["feature_instance_id"]),
        title=row["title"],
        status=row["status"],
        document_id=str(row["document_id"]) if row["document_id"] else None,
        document_content_html=row["content_html"] if "content_html" in row.keys() else None,
        position=row["position"],
        created_at=row["created_at"],
        updated_at=row["updated_at"],
        created_by=str(row["created_by"]) if row["created_by"] else None,
        updated_by=str(row["updated_by"]) if row["updated_by"] else None,
    )


@router.get("/by-instance/{feature_instance_id}", response_model=list[TodoItemResponse])
@require_any_permission_decorator(PermissionEnum.ADMIN, PermissionEnum.CAN_ACCESS_OWN_TRIBES)
async def list_todo_items(feature_instance_id: str, current_user: dict = Depends(get_current_user)):
    pool = get_database()
    async with pool.acquire() as conn:
        project_id = await _get_feature_instance_project(conn, feature_instance_id)
    await check_project_access_or_admin(project_id, current_user, pool, min_position='guest')
    async with pool.acquire() as conn:
        rows = await conn.fetch(
            """
            SELECT t.*, d.content_html
            FROM todo_items t
            LEFT JOIN documents d ON d.id = t.document_id
            WHERE t.feature_instance_id = $1
            ORDER BY t.position ASC, t.created_at ASC
            """,
            UUID(feature_instance_id)
        )
    return [_row_to_todo(r) for r in rows]


@router.post("/", response_model=TodoItemResponse, status_code=status.HTTP_201_CREATED)
@require_any_permission_decorator(PermissionEnum.ADMIN, PermissionEnum.CAN_ACCESS_OWN_TRIBES)
async def create_todo_item(data: TodoItemCreate, current_user: dict = Depends(get_current_user)):
    pool = get_database()
    user_id = UUID(str(current_user["id"]))
    async with pool.acquire() as conn:
        project_id = await _get_feature_instance_project(conn, data.feature_instance_id)
    await check_project_access_or_admin(project_id, current_user, pool, min_position='member')
    async with pool.acquire() as conn:
        row = await conn.fetchrow(
            """
            INSERT INTO todo_items (feature_instance_id, title, position, created_by, updated_by)
            VALUES ($1, $2, $3, $4, $4)
            RETURNING *
            """,
            UUID(data.feature_instance_id), data.title, data.position, user_id
        )
    return _row_to_todo(row)


@router.patch("/{item_id}", response_model=TodoItemResponse)
@require_any_permission_decorator(PermissionEnum.ADMIN, PermissionEnum.CAN_ACCESS_OWN_TRIBES)
async def update_todo_item(item_id: str, data: TodoItemUpdate, current_user: dict = Depends(get_current_user)):
    pool = get_database()
    user_id = UUID(str(current_user["id"]))
    async with pool.acquire() as conn:
        item_row = await conn.fetchrow("SELECT * FROM todo_items WHERE id = $1", UUID(item_id))
        if not item_row:
            raise HTTPException(status_code=status.HTTP_404_NOT_FOUND, detail="Todo item not found.")
        project_id = await _get_feature_instance_project(conn, str(item_row["feature_instance_id"]))
    await check_project_access_or_admin(project_id, current_user, pool, min_position='member')
    async with pool.acquire() as conn:

        now = datetime.now(timezone.utc)
        updates: dict = {"updated_by": user_id, "updated_at": now}
        if data.title is not None:
            updates["title"] = data.title
        if data.status is not None:
            updates["status"] = data.status
        if data.position is not None:
            updates["position"] = data.position

        if updates:
            set_clauses = ", ".join(f"{k} = ${i+2}" for i, k in enumerate(updates.keys()))
            values = list(updates.values())
            await conn.execute(
                f"UPDATE todo_items SET {set_clauses} WHERE id = $1",
                UUID(item_id), *values
            )

        # Handle document content update
        if data.document_content_html is not None:
            doc_row = await conn.fetchrow("SELECT document_id FROM todo_items WHERE id = $1", UUID(item_id))
            doc_id = doc_row["document_id"] if doc_row else None
            if doc_id is None:
                # Create the document
                new_doc = await conn.fetchrow(
                    """
                    INSERT INTO documents (content_html, content_text, content_summary, created_by, updated_by)
                    VALUES ($1, $2, $3, $4, $4)
                    RETURNING id
                    """,
                    data.document_content_html,
                    strip_html(data.document_content_html),
                    extract_content_summary(data.document_content_html),
                    user_id,
                )
                doc_id = new_doc["id"]
                await conn.execute(
                    "UPDATE todo_items SET document_id = $1 WHERE id = $2",
                    doc_id, UUID(item_id)
                )
            else:
                await conn.execute(
                    "UPDATE documents SET content_html = $1, content_text = $2, content_summary = $3, updated_at = $4, updated_by = $5 WHERE id = $6",
                    data.document_content_html,
                    strip_html(data.document_content_html),
                    extract_content_summary(data.document_content_html),
                    now,
                    user_id,
                    doc_id,
                )

        result_row = await conn.fetchrow(
            """
            SELECT t.*, d.content_html
            FROM todo_items t
            LEFT JOIN documents d ON d.id = t.document_id
            WHERE t.id = $1
            """,
            UUID(item_id)
        )
    return _row_to_todo(result_row)


@router.delete("/{item_id}", status_code=status.HTTP_204_NO_CONTENT)
@require_any_permission_decorator(PermissionEnum.ADMIN, PermissionEnum.CAN_ACCESS_OWN_TRIBES)
async def delete_todo_item(item_id: str, current_user: dict = Depends(get_current_user)):
    pool = get_database()
    async with pool.acquire() as conn:
        item_row = await conn.fetchrow("SELECT * FROM todo_items WHERE id = $1", UUID(item_id))
        if not item_row:
            raise HTTPException(status_code=status.HTTP_404_NOT_FOUND, detail="Todo item not found.")
        project_id = await _get_feature_instance_project(conn, str(item_row["feature_instance_id"]))
    await check_project_access_or_admin(project_id, current_user, pool, min_position='member')
    async with pool.acquire() as conn:
        await conn.execute("DELETE FROM todo_items WHERE id = $1", UUID(item_id))
