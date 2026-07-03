from fastapi import APIRouter, Depends

from app.platform.core.database import get_database
from app.platform.core.authentication.router import get_current_user
from app.platform.core.authorization.router import require_any_permission_decorator
from app.platform.core.authorization.models import PermissionEnum
from app.features.glue.quick_add_defaults.models import (
    QuickAddDefaultEntry,
    QuickAddDefaultsResponse,
    QuickAddDefaultUpdate,
)
from app.features.glue.quick_add_defaults import service

router = APIRouter(prefix="/dashboard", tags=["features_glue_quick_add_defaults"])


@router.get("/quick-add-defaults", response_model=QuickAddDefaultsResponse)
@require_any_permission_decorator(PermissionEnum.ADMIN, PermissionEnum.CAN_ACCESS_OWN_TRIBES)
async def get_quick_add_defaults(current_user: dict = Depends(get_current_user)):
    """Get the current user's configured quick-add default feature instance for tasks and events.

    **Permissions:** admin | can_access_attached_tribes
    """
    pool = get_database()
    return await service.get_quick_add_defaults(current_user["id"], pool)


@router.put("/quick-add-defaults/{quick_add_type}", response_model=QuickAddDefaultEntry)
@require_any_permission_decorator(PermissionEnum.ADMIN, PermissionEnum.CAN_ACCESS_OWN_TRIBES)
async def set_quick_add_default(
    quick_add_type: str,
    data: QuickAddDefaultUpdate,
    current_user: dict = Depends(get_current_user),
):
    """Set or clear the current user's configured default feature instance for quick-add.

    Passing a null `feature_instance_id` clears the configured default,
    leaving the quick-add popup with no preselected feature instance.

    **Permissions:** admin | can_access_attached_tribes
    """
    pool = get_database()
    return await service.set_quick_add_default(current_user["id"], quick_add_type, data, pool, current_user)
