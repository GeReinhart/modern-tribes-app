from datetime import date
from uuid import UUID

from fastapi import APIRouter, Depends, HTTPException, status

from app.platform.core.authentication.router import get_current_user
from app.platform.core.authorization.router import require_any_permission_decorator
from app.platform.core.authorization.models import PermissionEnum
from app.platform.core.authorization.permissions import get_user_permissions
from app.platform.core.database import get_database
from app.platform.functions.labels import repository as labels_repo
from app.features.daily_journal import repository as journal_repo
from app.features.daily_journal import repository_dashboard as journal_dash_repo
from app.features.daily_journal import service as journal_service
from app.features.daily_journal.label_service import require_feature_access
from app.features.daily_journal.models import (
    JournalBlockCreate,
    JournalBlockUpdate,
    JournalBlockReorder,
    JournalBlockResponse,
    JournalBlockListResponse,
    JournalDaysResponse,
    JournalDashboardResponse,
    JournalDashboardEntry,
    JournalAccessibleDatesResponse,
)

router = APIRouter(prefix="/daily-journal", tags=["features_daily_journal"])


def _row_to_block(row: dict) -> JournalBlockResponse:
    return JournalBlockResponse(
        id=str(row["id"]),
        feature_instance_id=str(row["feature_instance_id"]),
        date=row["date"],
        document_id=str(row["document_id"]) if row.get("document_id") else None,
        position=row["position"],
        content_html=row.get("content_html"),
        content_summary=row.get("content_summary"),
        label_ids=list(row.get("label_ids") or []),
        status=row["status"],
        created_at=row["created_at"],
        updated_at=row["updated_at"],
        created_by=str(row["created_by"]) if row.get("created_by") else None,
        updated_by=str(row["updated_by"]) if row.get("updated_by") else None,
    )


@router.get("/accessible-dates", response_model=JournalAccessibleDatesResponse)
@require_any_permission_decorator(PermissionEnum.ADMIN, PermissionEnum.CAN_ACCESS_OWN_TRIBES)
async def list_accessible_journal_dates(
    year: int, month: int, current_user: dict = Depends(get_current_user)
):
    """List all dates in a month that have active journal blocks across accessible journals."""
    pool = get_database()
    user_id = str(current_user["id"])
    user_perms = await get_user_permissions(pool, user_id)
    if PermissionEnum.ADMIN in user_perms:
        dates = await journal_dash_repo.fetch_all_dates_for_month(pool, year, month)
    else:
        dates = await journal_dash_repo.fetch_accessible_dates_for_month(pool, user_id, year, month)
    return JournalAccessibleDatesResponse(dates=dates)


@router.get("/accessible", response_model=JournalDashboardResponse)
@require_any_permission_decorator(PermissionEnum.ADMIN, PermissionEnum.CAN_ACCESS_OWN_TRIBES)
async def list_accessible_journal_summary(
    date: date, current_user: dict = Depends(get_current_user)
):
    """List journal tabs with block count for a given day (for dashboard planning)."""
    pool = get_database()
    user_id = str(current_user["id"])
    user_perms = await get_user_permissions(pool, user_id)
    if PermissionEnum.ADMIN in user_perms:
        rows = await journal_dash_repo.fetch_all_journal_summary(pool, date)
    else:
        rows = await journal_dash_repo.fetch_accessible_journal_summary(pool, user_id, date)
    journals = [
        JournalDashboardEntry(
            feature_instance_id=str(r["feature_instance_id"]),
            feature_instance_name=r["feature_instance_name"],
            project_id=str(r["project_id"]),
            project_name=r["project_name"],
            block_count=r["block_count"],
        )
        for r in rows
    ]
    return JournalDashboardResponse(journals=journals)


@router.get("/{feature_instance_id}/days", response_model=JournalDaysResponse)
@require_any_permission_decorator(PermissionEnum.ADMIN, PermissionEnum.CAN_ACCESS_OWN_TRIBES)
async def list_journal_days(
    feature_instance_id: str, current_user: dict = Depends(get_current_user)
):
    """List dates that have at least one active journal block."""
    pool = get_database()
    await require_feature_access(pool, feature_instance_id, current_user, "guest")
    dates = await journal_repo.fetch_days_with_blocks(pool, feature_instance_id)
    return JournalDaysResponse(dates=dates)


@router.get("/{feature_instance_id}/blocks", response_model=JournalBlockListResponse)
@require_any_permission_decorator(PermissionEnum.ADMIN, PermissionEnum.CAN_ACCESS_OWN_TRIBES)
async def list_blocks_for_day(
    feature_instance_id: str, date: date, current_user: dict = Depends(get_current_user)
):
    """List all active blocks for a specific day."""
    pool = get_database()
    await require_feature_access(pool, feature_instance_id, current_user, "guest")
    rows = await journal_repo.fetch_blocks_for_day(pool, feature_instance_id, date)
    return JournalBlockListResponse(blocks=[_row_to_block(r) for r in rows])


@router.get("/{feature_instance_id}/blocks/by-label/{label_id}", response_model=JournalBlockListResponse)
@require_any_permission_decorator(PermissionEnum.ADMIN, PermissionEnum.CAN_ACCESS_OWN_TRIBES)
async def list_blocks_by_label(
    feature_instance_id: str, label_id: str, current_user: dict = Depends(get_current_user)
):
    """List active blocks tagged with a label across all days, most recent first."""
    pool = get_database()
    await require_feature_access(pool, feature_instance_id, current_user, "guest")
    rows = await journal_repo.fetch_blocks_by_label(pool, feature_instance_id, label_id)
    return JournalBlockListResponse(blocks=[_row_to_block(r) for r in rows])


@router.post("/blocks", response_model=JournalBlockResponse, status_code=status.HTTP_201_CREATED)
@require_any_permission_decorator(PermissionEnum.ADMIN, PermissionEnum.CAN_ACCESS_OWN_TRIBES)
async def create_block(data: JournalBlockCreate, current_user: dict = Depends(get_current_user)):
    """Create a new journal block, shifting existing blocks at or after the given position."""
    pool = get_database()
    user_id = str(current_user["id"])
    await require_feature_access(pool, data.feature_instance_id, current_user, "member")
    row = await journal_repo.insert_block(
        pool, data.feature_instance_id, data.date, data.position, data.content_html, user_id
    )
    block_id = str(row["id"])
    await journal_service.index_block(pool, block_id, user_id)
    full = await journal_repo.fetch_block(pool, block_id)
    return _row_to_block(full)


@router.patch("/blocks/{block_id}", response_model=JournalBlockResponse)
@require_any_permission_decorator(PermissionEnum.ADMIN, PermissionEnum.CAN_ACCESS_OWN_TRIBES)
async def update_block(
    block_id: str, data: JournalBlockUpdate, current_user: dict = Depends(get_current_user)
):
    """Update a journal block's rich-text content."""
    pool = get_database()
    user_id = str(current_user["id"])
    async with pool.acquire() as conn:
        blk = await conn.fetchrow(
            "SELECT feature_instance_id FROM journal_blocks WHERE id = $1", UUID(block_id)
        )
    if not blk:
        raise HTTPException(status_code=status.HTTP_404_NOT_FOUND, detail="Block not found.")
    await require_feature_access(pool, str(blk["feature_instance_id"]), current_user, "member")
    if data.content_html is not None:
        await journal_repo.update_block_content(pool, block_id, data.content_html, user_id)
    await journal_service.index_block(pool, block_id, user_id)
    full = await journal_repo.fetch_block(pool, block_id)
    return _row_to_block(full)


@router.delete("/blocks/{block_id}", status_code=status.HTTP_200_OK)
@require_any_permission_decorator(PermissionEnum.ADMIN, PermissionEnum.CAN_ACCESS_OWN_TRIBES)
async def delete_block(block_id: str, current_user: dict = Depends(get_current_user)):
    """Archive a journal block."""
    pool = get_database()
    user_id = str(current_user["id"])
    async with pool.acquire() as conn:
        blk = await conn.fetchrow(
            "SELECT feature_instance_id FROM journal_blocks WHERE id = $1", UUID(block_id)
        )
    if not blk:
        raise HTTPException(status_code=status.HTTP_404_NOT_FOUND, detail="Block not found.")
    await require_feature_access(pool, str(blk["feature_instance_id"]), current_user, "member")
    await journal_repo.archive_block(pool, block_id, user_id)
    await journal_service.archive_block_index(pool, block_id, user_id)
    return {"id": block_id, "status": "archived"}


@router.put("/blocks/reorder", status_code=status.HTTP_200_OK)
@require_any_permission_decorator(PermissionEnum.ADMIN, PermissionEnum.CAN_ACCESS_OWN_TRIBES)
async def reorder_blocks(data: JournalBlockReorder, current_user: dict = Depends(get_current_user)):
    """Reorder blocks within a day by providing the full ordered list of IDs."""
    pool = get_database()
    user_id = str(current_user["id"])
    await require_feature_access(pool, data.feature_instance_id, current_user, "member")
    await journal_repo.reorder_blocks(pool, data.feature_instance_id, data.date, data.ordered_ids, user_id)
    return {"ordered_ids": data.ordered_ids}


@router.post("/blocks/{block_id}/labels/{label_id}", response_model=list[str])
@require_any_permission_decorator(PermissionEnum.ADMIN, PermissionEnum.CAN_ACCESS_OWN_TRIBES)
async def toggle_block_label(
    block_id: str, label_id: str, current_user: dict = Depends(get_current_user)
):
    """Toggle a label on a journal block."""
    pool = get_database()
    async with pool.acquire() as conn:
        blk = await conn.fetchrow(
            "SELECT feature_instance_id FROM journal_blocks WHERE id = $1", UUID(block_id)
        )
    if not blk:
        raise HTTPException(status_code=status.HTTP_404_NOT_FOUND, detail="Block not found.")
    await require_feature_access(pool, str(blk["feature_instance_id"]), current_user, "member")
    label_ids = await labels_repo.toggle_entity_label(pool, block_id, "journal_block", label_id)
    await journal_service.index_block(pool, block_id, str(current_user["id"]))
    return label_ids

