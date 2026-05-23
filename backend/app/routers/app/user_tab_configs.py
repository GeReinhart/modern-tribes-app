from fastapi import APIRouter, Depends

from ..auth.authentification import get_current_user
from ..auth.authorization import require_any_permission_decorator
from ...models.auth.auth import PermissionEnum
from ...models.app.user_tab_configs import UserTabConfigRequest, UserTabConfigResponse
from ...core.database import get_database
from ...services import user_tab_config_service

router = APIRouter(prefix="/user-tab-configs", tags=["app_user_tab_configs"])


@router.get("/{context_key}", response_model=UserTabConfigResponse)
@require_any_permission_decorator(PermissionEnum.ADMIN, PermissionEnum.CAN_ACCESS_OWN_TRIBES)
async def get_tab_config(
    context_key: str,
    current_user: dict = Depends(get_current_user),
):
    pool = get_database()
    return await user_tab_config_service.get_tab_config(current_user['id'], context_key, pool)


@router.put("/{context_key}", response_model=UserTabConfigResponse)
@require_any_permission_decorator(PermissionEnum.ADMIN, PermissionEnum.CAN_ACCESS_OWN_TRIBES)
async def save_tab_config(
    context_key: str,
    data: UserTabConfigRequest,
    current_user: dict = Depends(get_current_user),
):
    pool = get_database()
    return await user_tab_config_service.save_tab_config(
        current_user['id'], context_key, data, pool, current_user
    )
