from fastapi import HTTPException

from app.features.bookmarks.models import (
    UserBookmarkCreate,
    UserBookmarkItem,
    UserBookmarksReorderRequest,
    UserBookmarksResponse,
    UserBookmarkUpdate,
)
from app.features.bookmarks import repository as user_bookmarks_repository


async def get_bookmarks(user_id: str, pool) -> UserBookmarksResponse:
    rows = await user_bookmarks_repository.get_bookmarks(pool, user_id)
    return UserBookmarksResponse(bookmarks=[UserBookmarkItem(**row) for row in rows])


async def add_bookmark(user_id: str, data: UserBookmarkCreate, pool, current_user: dict) -> UserBookmarkItem:
    row = await user_bookmarks_repository.add_bookmark(
        pool,
        user_id,
        data.page_path,
        data.page_title,
        current_user["id"],
        data.description,
        data.color_text,
        data.color_background,
    )
    return UserBookmarkItem(**row)


async def update_bookmark(
    user_id: str,
    bookmark_id: str,
    data: UserBookmarkUpdate,
    pool,
    current_user: dict,
) -> UserBookmarkItem:
    row = await user_bookmarks_repository.update_bookmark(
        pool,
        user_id,
        bookmark_id,
        data.page_title,
        data.description,
        data.color_text,
        data.color_background,
        current_user["id"],
    )
    if row is None:
        raise HTTPException(status_code=404, detail="Bookmark not found")
    return UserBookmarkItem(**row)


async def remove_bookmark(user_id: str, bookmark_id: str, pool) -> None:
    await user_bookmarks_repository.remove_bookmark(pool, user_id, bookmark_id)


async def reorder_bookmarks(
    user_id: str,
    data: UserBookmarksReorderRequest,
    pool,
    current_user: dict,
) -> UserBookmarksResponse:
    rows = await user_bookmarks_repository.reorder_bookmarks(
        pool,
        user_id,
        data.ordered_ids,
        current_user["id"],
    )
    return UserBookmarksResponse(bookmarks=[UserBookmarkItem(**row) for row in rows])
