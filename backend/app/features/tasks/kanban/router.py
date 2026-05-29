from fastapi import APIRouter, Depends, HTTPException, status
from uuid import UUID
from datetime import datetime, timezone

from app.platform.core.authentication.router import get_current_user
from app.platform.core.authorization.router import require_any_permission_decorator
from app.platform.core.authorization.models import PermissionEnum
from app.platform.core.database import get_database
from app.platform.core.authorization.project_access import check_project_access_or_admin
from app.platform.core.utils.document_helpers import strip_html, extract_content_summary
from app.features.tasks.kanban import repository as repo
from app.platform.functions.people.persons import repository as persons_repository
from app.platform.functions.labels import repository as labels_repo
from app.features.tasks.kanban.models import (
    KanbanBoard, KanbanColumnResponse, KanbanCardResponse, KanbanLabel, PersonOption,
    ColumnCreate, ColumnUpdate, CardCreate, CardUpdate, MoveCard, ReorderCard,
    LabelCreate, LabelUpdate,
)

router = APIRouter(prefix="/kanban", tags=["feature_kanban"])


def _column(row: dict) -> KanbanColumnResponse:
    return KanbanColumnResponse(id=str(row["id"]), name=row["name"], position=row["position"])


def _label(row: dict) -> KanbanLabel:
    return KanbanLabel(id=str(row["id"]), name=row["name"], color=row["color"], position=row["position"])


def _card(row: dict) -> KanbanCardResponse:
    label_ids = [str(lid) for lid in (row.get("label_ids") or [])]
    return KanbanCardResponse(
        id=str(row["id"]),
        feature_instance_id=str(row["feature_instance_id"]),
        column_id=str(row["column_id"]),
        title=row["title"],
        assigned_person_id=str(row["assigned_person_id"]) if row.get("assigned_person_id") else None,
        assigned_person_name=row.get("assigned_person_name"),
        document_id=str(row["document_id"]) if row.get("document_id") else None,
        document_content_html=row.get("document_content_html"),
        position=row["position"],
        status=row["status"],
        size=row.get("size"),
        due_date=row.get("due_date"),
        label_ids=label_ids,
    )


async def _feature_project(conn, feature_instance_id: str) -> str:
    row = await conn.fetchrow("SELECT project_id FROM projects_features WHERE id = $1", UUID(feature_instance_id))
    if not row:
        raise HTTPException(status_code=404, detail="Feature not found.")
    return str(row["project_id"])


async def _require_feature_access(feature_instance_id: str, user: dict, pool, min_position: str = "guest"):
    async with pool.acquire() as conn:
        project_id = await _feature_project(conn, feature_instance_id)
    await check_project_access_or_admin(project_id, user, pool, min_position=min_position)
    return project_id


@router.get("/board/{feature_instance_id}", response_model=KanbanBoard)
@require_any_permission_decorator(PermissionEnum.ADMIN, PermissionEnum.CAN_ACCESS_OWN_TRIBES)
async def get_board(feature_instance_id: str, current_user: dict = Depends(get_current_user)):
    pool = get_database()
    await _require_feature_access(feature_instance_id, current_user, pool, "guest")
    data = await repo.fetch_board(pool, feature_instance_id)
    return KanbanBoard(
        columns=[_column(c) for c in data["columns"]],
        cards=[_card(c) for c in data["cards"]],
        labels=[_label(lb) for lb in data["labels"]],
    )


@router.get("/persons/{feature_instance_id}", response_model=list[PersonOption])
@require_any_permission_decorator(PermissionEnum.ADMIN, PermissionEnum.CAN_ACCESS_OWN_TRIBES)
async def list_persons(feature_instance_id: str, current_user: dict = Depends(get_current_user)):
    pool = get_database()
    await _require_feature_access(feature_instance_id, current_user, pool, "guest")
    rows = await persons_repository.fetch_persons_for_feature(pool, feature_instance_id, str(current_user["id"]))
    return [PersonOption(id=str(r["id"]), name=r["name"]) for r in rows]


@router.post("/columns", response_model=KanbanColumnResponse, status_code=status.HTTP_201_CREATED)
@require_any_permission_decorator(PermissionEnum.ADMIN, PermissionEnum.CAN_ACCESS_OWN_TRIBES)
async def create_column(data: ColumnCreate, current_user: dict = Depends(get_current_user)):
    pool = get_database()
    await _require_feature_access(data.feature_instance_id, current_user, pool, "manager")
    cols = await repo.fetch_columns_sorted(pool, data.feature_instance_id)
    if len(cols) >= 4:
        raise HTTPException(status_code=400, detail="Maximum 4 columns allowed.")
    next_pos = (cols[-1]["position"] + 1) if cols else 1
    col = await repo.insert_column(pool, data.feature_instance_id, data.name, next_pos, str(current_user["id"]))
    return _column(col)


@router.patch("/columns/{column_id}", response_model=KanbanColumnResponse)
@require_any_permission_decorator(PermissionEnum.ADMIN, PermissionEnum.CAN_ACCESS_OWN_TRIBES)
async def rename_column(column_id: str, data: ColumnUpdate, current_user: dict = Depends(get_current_user)):
    pool = get_database()
    col = await repo.fetch_column(pool, column_id)
    if not col:
        raise HTTPException(status_code=404, detail="Column not found.")
    await _require_feature_access(str(col["feature_instance_id"]), current_user, pool, "manager")
    updated = await repo.update_column(pool, column_id, data.name, str(current_user["id"]))
    return _column(updated)


@router.post("/columns/{column_id}/move", response_model=list[KanbanColumnResponse])
@require_any_permission_decorator(PermissionEnum.ADMIN, PermissionEnum.CAN_ACCESS_OWN_TRIBES)
async def move_column(column_id: str, data: MoveCard, current_user: dict = Depends(get_current_user)):
    pool = get_database()
    col = await repo.fetch_column(pool, column_id)
    if not col:
        raise HTTPException(status_code=404, detail="Column not found.")
    fid = str(col["feature_instance_id"])
    await _require_feature_access(fid, current_user, pool, "manager")
    cols = await repo.fetch_columns_sorted(pool, fid)
    idx = next((i for i, c in enumerate(cols) if str(c["id"]) == column_id), None)
    if idx is None:
        raise HTTPException(status_code=400, detail="Column not found in board.")
    target_idx = idx - 1 if data.direction == "prev" else idx + 1
    if target_idx < 0 or target_idx >= len(cols):
        return []
    uid = str(current_user["id"])
    await repo.swap_column_positions(pool, column_id, str(cols[target_idx]["id"]), uid)
    updated_cols = await repo.fetch_columns_sorted(pool, fid)
    updated_ids = {str(cols[idx]["id"]), str(cols[target_idx]["id"])}
    return [_column(c) for c in updated_cols if str(c["id"]) in updated_ids]


@router.delete("/columns/{column_id}", status_code=status.HTTP_204_NO_CONTENT)
@require_any_permission_decorator(PermissionEnum.ADMIN, PermissionEnum.CAN_ACCESS_OWN_TRIBES)
async def delete_column(column_id: str, current_user: dict = Depends(get_current_user)):
    pool = get_database()
    col = await repo.fetch_column(pool, column_id)
    if not col:
        raise HTTPException(status_code=404, detail="Column not found.")
    fid = str(col["feature_instance_id"])
    await _require_feature_access(fid, current_user, pool, "manager")
    cols = await repo.fetch_columns_sorted(pool, fid)
    if len(cols) <= 2:
        raise HTTPException(status_code=400, detail="Cannot delete: at least 2 columns required.")
    if col["position"] == cols[0]["position"] or col["position"] == cols[-1]["position"]:
        raise HTTPException(status_code=400, detail="Cannot delete the first or last column.")
    await repo.delete_column(pool, column_id)


@router.post("/cards", response_model=KanbanCardResponse, status_code=status.HTTP_201_CREATED)
@require_any_permission_decorator(PermissionEnum.ADMIN, PermissionEnum.CAN_ACCESS_OWN_TRIBES)
async def create_card(data: CardCreate, current_user: dict = Depends(get_current_user)):
    pool = get_database()
    await _require_feature_access(data.feature_instance_id, current_user, pool, "member")
    row = await repo.insert_card(
        pool, data.feature_instance_id, data.column_id,
        data.title, data.assigned_person_id, data.position, str(current_user["id"]),
    )
    return _card(row)


@router.patch("/cards/{card_id}", response_model=KanbanCardResponse)
@require_any_permission_decorator(PermissionEnum.ADMIN, PermissionEnum.CAN_ACCESS_OWN_TRIBES)
async def update_card(card_id: str, data: CardUpdate, current_user: dict = Depends(get_current_user)):
    pool = get_database()
    card = await repo.fetch_card(pool, card_id)
    if not card:
        raise HTTPException(status_code=404, detail="Card not found.")
    await _require_feature_access(str(card["feature_instance_id"]), current_user, pool, "member")
    uid = str(current_user["id"])
    await repo.update_card_fields(pool, card_id, data.title, data.assigned_person_id, data.clear_assignee, data.size, data.clear_size, data.due_date, data.clear_due_date, uid)
    if data.document_content_html is not None:
        await _upsert_card_document(pool, card, data.document_content_html, uid)
    return _card(await repo.fetch_card(pool, card_id))


async def _upsert_card_document(pool, card: dict, html: str, uid: str) -> None:
    now = datetime.now(timezone.utc)
    async with pool.acquire() as conn:
        doc_id = card.get("document_id")
        if doc_id is None:
            new_doc = await conn.fetchrow(
                "INSERT INTO documents (content_html, content_text, content_summary, created_by, updated_by) VALUES ($1, $2, $3, $4, $4) RETURNING id",
                html, strip_html(html), extract_content_summary(html), UUID(uid),
            )
            doc_id = new_doc["id"]
            await conn.execute("UPDATE kanban_cards SET document_id = $1 WHERE id = $2", doc_id, UUID(str(card["id"])))
        else:
            await conn.execute(
                "UPDATE documents SET content_html=$1, content_text=$2, content_summary=$3, updated_at=$4, updated_by=$5 WHERE id=$6",
                html, strip_html(html), extract_content_summary(html), now, UUID(uid), UUID(str(doc_id)),
            )


@router.delete("/cards/{card_id}", status_code=status.HTTP_204_NO_CONTENT)
@require_any_permission_decorator(PermissionEnum.ADMIN, PermissionEnum.CAN_ACCESS_OWN_TRIBES)
async def archive_card(card_id: str, current_user: dict = Depends(get_current_user)):
    pool = get_database()
    card = await repo.fetch_card(pool, card_id)
    if not card:
        raise HTTPException(status_code=404, detail="Card not found.")
    await _require_feature_access(str(card["feature_instance_id"]), current_user, pool, "member")
    await repo.archive_card(pool, card_id, str(current_user["id"]))


@router.post("/cards/{card_id}/restore", response_model=KanbanCardResponse)
@require_any_permission_decorator(PermissionEnum.ADMIN, PermissionEnum.CAN_ACCESS_OWN_TRIBES)
async def restore_card(card_id: str, current_user: dict = Depends(get_current_user)):
    pool = get_database()
    card = await repo.fetch_card(pool, card_id)
    if not card:
        raise HTTPException(status_code=404, detail="Card not found.")
    await _require_feature_access(str(card["feature_instance_id"]), current_user, pool, "member")
    await repo.restore_card(pool, card_id, str(current_user["id"]))
    return _card(await repo.fetch_card(pool, card_id))


@router.post("/cards/{card_id}/move", response_model=list[KanbanCardResponse])
@require_any_permission_decorator(PermissionEnum.ADMIN, PermissionEnum.CAN_ACCESS_OWN_TRIBES)
async def move_card(card_id: str, data: MoveCard, current_user: dict = Depends(get_current_user)):
    pool = get_database()
    card = await repo.fetch_card(pool, card_id)
    if not card:
        raise HTTPException(status_code=404, detail="Card not found.")
    fid = str(card["feature_instance_id"])
    await _require_feature_access(fid, current_user, pool, "member")
    cols = await repo.fetch_columns_sorted(pool, fid)
    col_ids = [str(c["id"]) for c in cols]
    current_idx = next((i for i, c in enumerate(cols) if str(c["id"]) == str(card["column_id"])), None)
    if current_idx is None:
        raise HTTPException(status_code=400, detail="Card column not found.")
    target_idx = current_idx - 1 if data.direction == "prev" else current_idx + 1
    if target_idx < 0 or target_idx >= len(cols):
        return []
    target_col_id = col_ids[target_idx]
    uid = str(current_user["id"])
    await repo.move_card_to_column(pool, card_id, target_col_id, uid)
    return [_card(await repo.fetch_card(pool, card_id))]


@router.post("/cards/{card_id}/reorder", response_model=list[KanbanCardResponse])
@require_any_permission_decorator(PermissionEnum.ADMIN, PermissionEnum.CAN_ACCESS_OWN_TRIBES)
async def reorder_card(card_id: str, data: ReorderCard, current_user: dict = Depends(get_current_user)):
    pool = get_database()
    card = await repo.fetch_card(pool, card_id)
    if not card:
        raise HTTPException(status_code=404, detail="Card not found.")
    await _require_feature_access(str(card["feature_instance_id"]), current_user, pool, "member")
    updated = await repo.reorder_card_in_column(pool, card_id, data.direction, str(current_user["id"]))
    return [_card(c) for c in updated]


# --- Labels ---

@router.get("/labels/{feature_instance_id}", response_model=list[KanbanLabel])
@require_any_permission_decorator(PermissionEnum.ADMIN, PermissionEnum.CAN_ACCESS_OWN_TRIBES)
async def list_labels(feature_instance_id: str, current_user: dict = Depends(get_current_user)):
    pool = get_database()
    await _require_feature_access(feature_instance_id, current_user, pool, "guest")
    rows = await labels_repo.fetch_labels_for_feature(pool, feature_instance_id)
    return [_label(r) for r in rows]


@router.post("/labels", response_model=KanbanLabel, status_code=status.HTTP_201_CREATED)
@require_any_permission_decorator(PermissionEnum.ADMIN, PermissionEnum.CAN_ACCESS_OWN_TRIBES)
async def create_label(data: LabelCreate, current_user: dict = Depends(get_current_user)):
    pool = get_database()
    await _require_feature_access(data.feature_instance_id, current_user, pool, "manager")
    row = await labels_repo.insert_feature_label(pool, data.feature_instance_id, data.name, data.color, str(current_user["id"]))
    return _label(row)


@router.patch("/labels/{label_id}", response_model=KanbanLabel)
@require_any_permission_decorator(PermissionEnum.ADMIN, PermissionEnum.CAN_ACCESS_OWN_TRIBES)
async def update_label(label_id: str, data: LabelUpdate, current_user: dict = Depends(get_current_user)):
    pool = get_database()
    lb = await labels_repo.fetch_label_by_id(pool, label_id)
    if not lb:
        raise HTTPException(status_code=404, detail="Label not found.")
    await _require_feature_access(str(lb["feature_instance_id"]), current_user, pool, "manager")
    updated = await labels_repo.update_feature_label(pool, label_id, data.name, data.color, str(current_user["id"]))
    return _label(updated)


@router.delete("/labels/{label_id}", status_code=status.HTTP_204_NO_CONTENT)
@require_any_permission_decorator(PermissionEnum.ADMIN, PermissionEnum.CAN_ACCESS_OWN_TRIBES)
async def delete_label(label_id: str, current_user: dict = Depends(get_current_user)):
    pool = get_database()
    lb = await labels_repo.fetch_label_by_id(pool, label_id)
    if not lb:
        raise HTTPException(status_code=404, detail="Label not found.")
    await _require_feature_access(str(lb["feature_instance_id"]), current_user, pool, "manager")
    await labels_repo.delete_feature_label(pool, label_id)


@router.post("/cards/{card_id}/labels/{label_id}", response_model=KanbanCardResponse)
@require_any_permission_decorator(PermissionEnum.ADMIN, PermissionEnum.CAN_ACCESS_OWN_TRIBES)
async def add_card_label(card_id: str, label_id: str, current_user: dict = Depends(get_current_user)):
    pool = get_database()
    card = await repo.fetch_card(pool, card_id)
    if not card:
        raise HTTPException(status_code=404, detail="Card not found.")
    await _require_feature_access(str(card["feature_instance_id"]), current_user, pool, "member")
    await labels_repo.add_entity_label(pool, card_id, 'kanban_card', label_id)
    return _card(await repo.fetch_card(pool, card_id))


@router.delete("/cards/{card_id}/labels/{label_id}", response_model=KanbanCardResponse)
@require_any_permission_decorator(PermissionEnum.ADMIN, PermissionEnum.CAN_ACCESS_OWN_TRIBES)
async def remove_card_label(card_id: str, label_id: str, current_user: dict = Depends(get_current_user)):
    pool = get_database()
    card = await repo.fetch_card(pool, card_id)
    if not card:
        raise HTTPException(status_code=404, detail="Card not found.")
    await _require_feature_access(str(card["feature_instance_id"]), current_user, pool, "member")
    await labels_repo.remove_entity_label(pool, card_id, 'kanban_card', label_id)
    return _card(await repo.fetch_card(pool, card_id))
