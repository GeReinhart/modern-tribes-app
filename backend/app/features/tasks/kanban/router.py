from fastapi import APIRouter, Depends, HTTPException, status
from uuid import UUID
from datetime import datetime, timezone

from app.platform.core.authentication.router import get_current_user
from app.platform.core.authorization.router import require_any_permission_decorator
from app.platform.core.authorization.models import PermissionEnum
from app.platform.core.database import get_database
from app.platform.core.utils.document_helpers import strip_html, extract_content_summary
from app.features.tasks import label_service
from app.features.tasks.kanban import repository as repo
from app.platform.functions.labels import repository as labels_repo
from app.platform.functions.search import index_repository as search_index
from app.features.tasks.models import PersonOption, FeatureLabel, FeatureLabelCreate, FeatureLabelUpdate
from app.features.tasks.kanban.models import (
    KanbanBoard, KanbanColumnResponse, KanbanCardResponse,
    ColumnCreate, ColumnUpdate, CardCreate, CardUpdate, MoveCard, ReorderCard,
)

router = APIRouter(prefix="/kanban", tags=["features_tasks_kanban"])


def _column(row: dict) -> KanbanColumnResponse:
    return KanbanColumnResponse(id=str(row["id"]), name=row["name"], position=row["position"])


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


@router.get("/board/{feature_instance_id}", response_model=KanbanBoard)
@require_any_permission_decorator(PermissionEnum.ADMIN, PermissionEnum.CAN_ACCESS_OWN_TRIBES)
async def get_board(feature_instance_id: str, current_user: dict = Depends(get_current_user)):
    """Get the full kanban board (columns, cards, labels) for a feature instance.

    **Permissions:** admin | can_access_attached_tribes
    **Feature access:** minimum position ≥ guest
    """
    pool = get_database()
    await label_service.require_feature_access(pool, feature_instance_id, current_user, "guest")
    data = await repo.fetch_board(pool, feature_instance_id)
    return KanbanBoard(
        columns=[_column(c) for c in data["columns"]],
        cards=[_card(c) for c in data["cards"]],
        labels=[FeatureLabel(**lb) for lb in data["labels"]],
    )


@router.get("/persons/{feature_instance_id}", response_model=list[PersonOption])
@require_any_permission_decorator(PermissionEnum.ADMIN, PermissionEnum.CAN_ACCESS_OWN_TRIBES)
async def list_persons(feature_instance_id: str, current_user: dict = Depends(get_current_user)):
    """List persons available for assignment in a kanban feature instance.

    **Permissions:** admin | can_access_attached_tribes
    """
    return await label_service.list_persons_for_feature(get_database(), feature_instance_id, current_user)


@router.post("/columns", response_model=KanbanColumnResponse, status_code=status.HTTP_201_CREATED)
@require_any_permission_decorator(PermissionEnum.ADMIN, PermissionEnum.CAN_ACCESS_OWN_TRIBES)
async def create_column(data: ColumnCreate, current_user: dict = Depends(get_current_user)):
    """Create a new column in a kanban board (max 4 columns).

    **Permissions:** admin | can_access_attached_tribes
    **Feature access:** minimum position ≥ manager
    """
    pool = get_database()
    await label_service.require_feature_access(pool, data.feature_instance_id, current_user, "manager")
    cols = await repo.fetch_columns_sorted(pool, data.feature_instance_id)
    if len(cols) >= 4:
        raise HTTPException(status_code=400, detail="Maximum 4 columns allowed.")
    next_pos = (cols[-1]["position"] + 1) if cols else 1
    col = await repo.insert_column(pool, data.feature_instance_id, data.name, next_pos, str(current_user["id"]))
    return _column(col)


@router.patch("/columns/{column_id}", response_model=KanbanColumnResponse)
@require_any_permission_decorator(PermissionEnum.ADMIN, PermissionEnum.CAN_ACCESS_OWN_TRIBES)
async def rename_column(column_id: str, data: ColumnUpdate, current_user: dict = Depends(get_current_user)):
    """Rename a kanban column.

    **Permissions:** admin | can_access_attached_tribes
    **Feature access:** minimum position ≥ manager
    """
    pool = get_database()
    col = await repo.fetch_column(pool, column_id)
    if not col:
        raise HTTPException(status_code=404, detail="Column not found.")
    await label_service.require_feature_access(pool, str(col["feature_instance_id"]), current_user, "manager")
    updated = await repo.update_column(pool, column_id, data.name, str(current_user["id"]))
    return _column(updated)


@router.post("/columns/{column_id}/move", response_model=list[KanbanColumnResponse])
@require_any_permission_decorator(PermissionEnum.ADMIN, PermissionEnum.CAN_ACCESS_OWN_TRIBES)
async def move_column(column_id: str, data: MoveCard, current_user: dict = Depends(get_current_user)):
    """Move a kanban column left or right.

    **Permissions:** admin | can_access_attached_tribes
    **Feature access:** minimum position ≥ manager
    """
    pool = get_database()
    col = await repo.fetch_column(pool, column_id)
    if not col:
        raise HTTPException(status_code=404, detail="Column not found.")
    fid = str(col["feature_instance_id"])
    await label_service.require_feature_access(pool, fid, current_user, "manager")
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
    """Delete a kanban column (must not be first or last; board must keep ≥ 2 columns).

    **Permissions:** admin | can_access_attached_tribes
    **Feature access:** minimum position ≥ manager
    """
    pool = get_database()
    col = await repo.fetch_column(pool, column_id)
    if not col:
        raise HTTPException(status_code=404, detail="Column not found.")
    fid = str(col["feature_instance_id"])
    await label_service.require_feature_access(pool, fid, current_user, "manager")
    cols = await repo.fetch_columns_sorted(pool, fid)
    if len(cols) <= 2:
        raise HTTPException(status_code=400, detail="Cannot delete: at least 2 columns required.")
    if col["position"] == cols[0]["position"] or col["position"] == cols[-1]["position"]:
        raise HTTPException(status_code=400, detail="Cannot delete the first or last column.")
    await repo.delete_column(pool, column_id)


@router.post("/cards", response_model=KanbanCardResponse, status_code=status.HTTP_201_CREATED)
@require_any_permission_decorator(PermissionEnum.ADMIN, PermissionEnum.CAN_ACCESS_OWN_TRIBES)
async def create_card(data: CardCreate, current_user: dict = Depends(get_current_user)):
    """Create a new kanban card.

    **Permissions:** admin | can_access_attached_tribes
    **Feature access:** minimum position ≥ member
    """
    pool = get_database()
    uid = str(current_user["id"])
    await label_service.require_feature_access(pool, data.feature_instance_id, current_user, "member")
    row = await repo.insert_card(
        pool, data.feature_instance_id, data.column_id,
        data.title, data.assigned_person_id, data.position, uid,
    )
    await search_index.index_kanban_card(pool, str(row["id"]), uid)
    return _card(row)


@router.patch("/cards/{card_id}", response_model=KanbanCardResponse)
@require_any_permission_decorator(PermissionEnum.ADMIN, PermissionEnum.CAN_ACCESS_OWN_TRIBES)
async def update_card(card_id: str, data: CardUpdate, current_user: dict = Depends(get_current_user)):
    """Update a kanban card's fields.

    **Permissions:** admin | can_access_attached_tribes
    **Feature access:** minimum position ≥ member
    """
    pool = get_database()
    card = await repo.fetch_card(pool, card_id)
    if not card:
        raise HTTPException(status_code=404, detail="Card not found.")
    await label_service.require_feature_access(pool, str(card["feature_instance_id"]), current_user, "member")
    uid = str(current_user["id"])
    await repo.update_card_fields(pool, card_id, data.title, data.assigned_person_id, data.clear_assignee, data.size, data.clear_size, data.due_date, data.clear_due_date, uid)
    if data.document_content_html is not None:
        await _upsert_card_document(pool, card, data.document_content_html, uid)
    updated = await repo.fetch_card(pool, card_id)
    if updated["status"] != "archived":
        await search_index.index_kanban_card(pool, card_id, uid)
    else:
        await search_index.archive_entity(pool, "kanban_card", card_id, uid)
    return _card(updated)


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
    """Archive (soft-delete) a kanban card.

    **Permissions:** admin | can_access_attached_tribes
    **Feature access:** minimum position ≥ member
    """
    pool = get_database()
    card = await repo.fetch_card(pool, card_id)
    if not card:
        raise HTTPException(status_code=404, detail="Card not found.")
    uid = str(current_user["id"])
    await label_service.require_feature_access(pool, str(card["feature_instance_id"]), current_user, "member")
    await repo.archive_card(pool, card_id, uid)
    await search_index.archive_entity(pool, "kanban_card", card_id, uid)


@router.post("/cards/{card_id}/restore", response_model=KanbanCardResponse)
@require_any_permission_decorator(PermissionEnum.ADMIN, PermissionEnum.CAN_ACCESS_OWN_TRIBES)
async def restore_card(card_id: str, current_user: dict = Depends(get_current_user)):
    """Restore an archived kanban card.

    **Permissions:** admin | can_access_attached_tribes
    **Feature access:** minimum position ≥ member
    """
    pool = get_database()
    card = await repo.fetch_card(pool, card_id)
    if not card:
        raise HTTPException(status_code=404, detail="Card not found.")
    uid = str(current_user["id"])
    await label_service.require_feature_access(pool, str(card["feature_instance_id"]), current_user, "member")
    await repo.restore_card(pool, card_id, uid)
    await search_index.index_kanban_card(pool, card_id, uid)
    return _card(await repo.fetch_card(pool, card_id))


@router.post("/cards/{card_id}/move", response_model=list[KanbanCardResponse])
@require_any_permission_decorator(PermissionEnum.ADMIN, PermissionEnum.CAN_ACCESS_OWN_TRIBES)
async def move_card(card_id: str, data: MoveCard, current_user: dict = Depends(get_current_user)):
    """Move a kanban card to the previous or next column.

    **Permissions:** admin | can_access_attached_tribes
    **Feature access:** minimum position ≥ member
    """
    pool = get_database()
    card = await repo.fetch_card(pool, card_id)
    if not card:
        raise HTTPException(status_code=404, detail="Card not found.")
    fid = str(card["feature_instance_id"])
    await label_service.require_feature_access(pool, fid, current_user, "member")
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
    """Reorder a kanban card within its column.

    **Permissions:** admin | can_access_attached_tribes
    **Feature access:** minimum position ≥ member
    """
    pool = get_database()
    card = await repo.fetch_card(pool, card_id)
    if not card:
        raise HTTPException(status_code=404, detail="Card not found.")
    await label_service.require_feature_access(pool, str(card["feature_instance_id"]), current_user, "member")
    updated = await repo.reorder_card_in_column(pool, card_id, data.direction, str(current_user["id"]))
    return [_card(c) for c in updated]


# --- Labels ---

@router.get("/labels/{feature_instance_id}", response_model=list[FeatureLabel])
@require_any_permission_decorator(PermissionEnum.ADMIN, PermissionEnum.CAN_ACCESS_OWN_TRIBES)
async def list_labels(feature_instance_id: str, current_user: dict = Depends(get_current_user)):
    """List all labels for a kanban feature instance.

    **Permissions:** admin | can_access_attached_tribes
    """
    return await label_service.list_feature_labels(get_database(), feature_instance_id, current_user)


@router.post("/labels", response_model=FeatureLabel, status_code=status.HTTP_201_CREATED)
@require_any_permission_decorator(PermissionEnum.ADMIN, PermissionEnum.CAN_ACCESS_OWN_TRIBES)
async def create_label(data: FeatureLabelCreate, current_user: dict = Depends(get_current_user)):
    """Create a new label for a kanban feature instance.

    **Permissions:** admin | can_access_attached_tribes
    """
    return await label_service.create_feature_label(get_database(), data, current_user)


@router.patch("/labels/{label_id}", response_model=FeatureLabel)
@require_any_permission_decorator(PermissionEnum.ADMIN, PermissionEnum.CAN_ACCESS_OWN_TRIBES)
async def update_label(label_id: str, data: FeatureLabelUpdate, current_user: dict = Depends(get_current_user)):
    """Update a kanban label.

    **Permissions:** admin | can_access_attached_tribes
    """
    return await label_service.update_feature_label(get_database(), label_id, data, current_user)


@router.delete("/labels/{label_id}", status_code=status.HTTP_204_NO_CONTENT)
@require_any_permission_decorator(PermissionEnum.ADMIN, PermissionEnum.CAN_ACCESS_OWN_TRIBES)
async def delete_label(label_id: str, current_user: dict = Depends(get_current_user)):
    """Delete a kanban label.

    **Permissions:** admin | can_access_attached_tribes
    """
    await label_service.delete_feature_label(get_database(), label_id, current_user)


@router.post("/cards/{card_id}/labels/{label_id}", response_model=KanbanCardResponse)
@require_any_permission_decorator(PermissionEnum.ADMIN, PermissionEnum.CAN_ACCESS_OWN_TRIBES)
async def add_card_label(card_id: str, label_id: str, current_user: dict = Depends(get_current_user)):
    """Add a label to a kanban card.

    **Permissions:** admin | can_access_attached_tribes
    **Feature access:** minimum position ≥ member
    """
    pool = get_database()
    card = await repo.fetch_card(pool, card_id)
    if not card:
        raise HTTPException(status_code=404, detail="Card not found.")
    uid = str(current_user["id"])
    await label_service.require_feature_access(pool, str(card["feature_instance_id"]), current_user, "member")
    await labels_repo.add_entity_label(pool, card_id, 'kanban_card', label_id)
    await search_index.index_kanban_card(pool, card_id, uid)
    return _card(await repo.fetch_card(pool, card_id))


@router.delete("/cards/{card_id}/labels/{label_id}", response_model=KanbanCardResponse)
@require_any_permission_decorator(PermissionEnum.ADMIN, PermissionEnum.CAN_ACCESS_OWN_TRIBES)
async def remove_card_label(card_id: str, label_id: str, current_user: dict = Depends(get_current_user)):
    """Remove a label from a kanban card.

    **Permissions:** admin | can_access_attached_tribes
    **Feature access:** minimum position ≥ member
    """
    pool = get_database()
    card = await repo.fetch_card(pool, card_id)
    if not card:
        raise HTTPException(status_code=404, detail="Card not found.")
    uid = str(current_user["id"])
    await label_service.require_feature_access(pool, str(card["feature_instance_id"]), current_user, "member")
    await labels_repo.remove_entity_label(pool, card_id, 'kanban_card', label_id)
    await search_index.index_kanban_card(pool, card_id, uid)
    return _card(await repo.fetch_card(pool, card_id))
