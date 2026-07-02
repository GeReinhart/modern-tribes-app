from fastapi import APIRouter, Depends, status

from app.platform.core.database import get_database
from app.platform.core.authentication.router import get_current_user
from app.platform.core.authorization.router import require_any_permission_decorator
from app.platform.core.authorization.models import PermissionEnum
from app.features.glue.dashboard.models import PinnedTabCreate, PinnedTabItem, PinnedTabsResponse
from app.features.glue.dashboard import service

router = APIRouter(prefix="/dashboard", tags=["features_glue_dashboard"])


@router.get("/pinned-tabs", response_model=PinnedTabsResponse)
@require_any_permission_decorator(PermissionEnum.ADMIN, PermissionEnum.CAN_ACCESS_OWN_TRIBES)
async def list_pinned_tabs(current_user: dict = Depends(get_current_user)):
    """List the current user's pinned bookmark tabs for the dashboard.

    **Permissions:** admin | can_access_attached_tribes
    """
    pool = get_database()
    return await service.list_pinned_tabs(current_user["id"], pool)


@router.post("/pinned-tabs", response_model=PinnedTabItem, status_code=status.HTTP_201_CREATED)
@require_any_permission_decorator(PermissionEnum.ADMIN, PermissionEnum.CAN_ACCESS_OWN_TRIBES)
async def pin_bookmark_tab(
    data: PinnedTabCreate,
    current_user: dict = Depends(get_current_user),
):
    """Pin a bookmark as a tab on the dashboard.

    **Permissions:** admin | can_access_attached_tribes
    """
    pool = get_database()
    return await service.pin_bookmark(current_user["id"], data.bookmark_id, pool, current_user)


@router.delete("/pinned-tabs/{pinned_tab_id}", status_code=status.HTTP_204_NO_CONTENT)
@require_any_permission_decorator(PermissionEnum.ADMIN, PermissionEnum.CAN_ACCESS_OWN_TRIBES)
async def unpin_bookmark_tab(
    pinned_tab_id: str,
    current_user: dict = Depends(get_current_user),
):
    """Remove a pinned bookmark tab from the dashboard.

    **Permissions:** admin | can_access_attached_tribes
    """
    pool = get_database()
    await service.unpin_tab(pinned_tab_id, current_user["id"], pool)
