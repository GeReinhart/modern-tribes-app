from fastapi import HTTPException

from app.features.glue.dashboard.models import PinnedTabItem, PinnedTabsResponse
from app.features.glue.dashboard import repository


async def list_pinned_tabs(user_id: str, pool) -> PinnedTabsResponse:
    rows = await repository.list_pinned_tabs(pool, user_id)
    return PinnedTabsResponse(pinned_tabs=[PinnedTabItem(**row) for row in rows])


async def pin_bookmark(user_id: str, bookmark_id: str, pool, current_user: dict) -> PinnedTabItem:
    owner = await repository.get_bookmark_owner(pool, bookmark_id)
    if owner is None:
        raise HTTPException(status_code=404, detail="Bookmark not found")
    if owner != str(user_id):
        raise HTTPException(status_code=403, detail="This bookmark does not belong to you")

    already_pinned = await repository.is_bookmark_pinned(pool, user_id, bookmark_id)
    if already_pinned:
        raise HTTPException(status_code=409, detail="This bookmark is already pinned as a tab")

    row = await repository.pin_bookmark(pool, str(user_id), bookmark_id, str(current_user["id"]))
    return PinnedTabItem(**row)


async def unpin_tab(pinned_tab_id: str, user_id: str, pool) -> None:
    tab = await repository.get_pinned_tab_by_id(pool, pinned_tab_id, user_id)
    if tab is None:
        raise HTTPException(status_code=404, detail="Pinned tab not found")

    pinned_user = await _get_pinned_tab_user(pool, pinned_tab_id)
    if pinned_user != str(user_id):
        raise HTTPException(status_code=403, detail="This pinned tab does not belong to you")

    await repository.unpin_tab(pool, pinned_tab_id, str(user_id))


async def _get_pinned_tab_user(pool, pinned_tab_id: str) -> str | None:
    from uuid import UUID
    async with pool.acquire() as conn:
        row = await conn.fetchrow(
            "SELECT user_id::text FROM dashboard_pinned_tabs WHERE id = $1::uuid AND status = 'active'",
            UUID(pinned_tab_id),
        )
    return row["user_id"] if row else None


async def check_bookmark_not_pinned(bookmark_id: str, pool) -> None:
    if await repository.has_pinned_tabs(pool, bookmark_id):
        raise HTTPException(
            status_code=409,
            detail="This bookmark is pinned as a dashboard tab. Unpin it first before removing.",
        )
