from fastapi import APIRouter, Depends

from ..auth.authentification import get_current_user
from ..auth.authorization import require_any_permission_decorator
from ...models.auth.auth import PermissionEnum
from ...models.app.user_bookmarks import (
    UserBookmarkCreate, UserBookmarkItem, UserBookmarksResponse, UserBookmarksReorderRequest
)
from ...core.database import get_database
from ...services import user_bookmarks_service

router = APIRouter(prefix="/user-bookmarks", tags=["app_user_bookmarks"])


@router.get("", response_model=UserBookmarksResponse)
@require_any_permission_decorator(PermissionEnum.ADMIN, PermissionEnum.CAN_ACCESS_OWN_TRIBES)
async def get_bookmarks(current_user: dict = Depends(get_current_user)):
    pool = get_database()
    return await user_bookmarks_service.get_bookmarks(current_user['id'], pool)


@router.post("", response_model=UserBookmarkItem, status_code=201)
@require_any_permission_decorator(PermissionEnum.ADMIN, PermissionEnum.CAN_ACCESS_OWN_TRIBES)
async def add_bookmark(
    data: UserBookmarkCreate,
    current_user: dict = Depends(get_current_user),
):
    pool = get_database()
    return await user_bookmarks_service.add_bookmark(current_user['id'], data, pool, current_user)


@router.put("/order", response_model=UserBookmarksResponse)
@require_any_permission_decorator(PermissionEnum.ADMIN, PermissionEnum.CAN_ACCESS_OWN_TRIBES)
async def reorder_bookmarks(
    data: UserBookmarksReorderRequest,
    current_user: dict = Depends(get_current_user),
):
    pool = get_database()
    return await user_bookmarks_service.reorder_bookmarks(current_user['id'], data, pool, current_user)


@router.delete("/{bookmark_id}", status_code=204)
@require_any_permission_decorator(PermissionEnum.ADMIN, PermissionEnum.CAN_ACCESS_OWN_TRIBES)
async def remove_bookmark(
    bookmark_id: str,
    current_user: dict = Depends(get_current_user),
):
    pool = get_database()
    await user_bookmarks_service.remove_bookmark(current_user['id'], bookmark_id, pool)
