from fastapi import APIRouter, Depends, HTTPException, status
from uuid import UUID

from app.platform.core.authentication.router import get_current_user
from app.platform.core.authorization.router import require_any_permission_decorator
from app.platform.core.authorization.models import PermissionEnum
from app.platform.core.database import get_database
from app.features.tasks import label_service
from app.features.tasks.kanban import repository as repo
from app.features.tasks.models import PersonOption, FeatureLabel
from app.features.tasks.kanban.models import (
    KanbanBoard, KanbanColumnResponse, KanbanCardResponse,
    ColumnCreate, ColumnUpdate, MoveCard,
)
from app.features.tasks.kanban.card_router import card_router, _card  # noqa: F401 — re-exported

router = APIRouter(prefix="/kanban", tags=["features_tasks_kanban"])


def _column(row: dict) -> KanbanColumnResponse:
    return KanbanColumnResponse(id=str(row["id"]), name=row["name"], position=row["position"])


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
