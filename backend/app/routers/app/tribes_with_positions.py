from fastapi import APIRouter, status, Depends

from ..auth.authentification import get_current_user
from ..auth.authorization import require_any_permission_decorator
from ...models.auth.auth import PermissionEnum
from ...models.app.tribes_with_positions import (
    TribeWithPositionsCreate, TribeWithPositionsUpdate, TribeWithPositionsResponse
)
from ...core.database import get_database
from ...services import tribe_service
from ...utils.ownership import check_own_tribe_position_or_admin
from ...utils.db_helpers import resolve_url_param_id

router = APIRouter(prefix="/tribes", tags=["app_tribes"])


@router.post("/with-positions", response_model=TribeWithPositionsResponse, status_code=status.HTTP_201_CREATED)
@require_any_permission_decorator(PermissionEnum.ADMIN, PermissionEnum.CAN_CREATE_OWN_TRIBES)
async def create_tribe_with_positions(data: TribeWithPositionsCreate, current_user: dict = Depends(get_current_user)):
    pool = get_database()
    return await tribe_service.create_tribe_with_positions(data, pool, current_user)


@router.get("/{tribe_id}/with-positions", response_model=TribeWithPositionsResponse)
@require_any_permission_decorator(PermissionEnum.ADMIN, PermissionEnum.CAN_ACCESS_OWN_TRIBES)
async def get_tribe_with_positions(tribe_id: str, current_user: dict = Depends(get_current_user)):
    pool = get_database()
    tribe_id = await resolve_url_param_id(pool, "tribes", tribe_id)
    await check_own_tribe_position_or_admin(tribe_id, current_user, pool)
    return await tribe_service.get_tribe_with_positions(tribe_id, pool)


@router.put("/{tribe_id}/with-positions", response_model=TribeWithPositionsResponse)
@require_any_permission_decorator(PermissionEnum.ADMIN, PermissionEnum.CAN_ACCESS_OWN_TRIBES)
async def update_tribe_with_positions(tribe_id: str, data: TribeWithPositionsUpdate, current_user: dict = Depends(get_current_user)):
    pool = get_database()
    tribe_id = await resolve_url_param_id(pool, "tribes", tribe_id)
    await check_own_tribe_position_or_admin(tribe_id, current_user, pool, required_position="manager")
    return await tribe_service.update_tribe_with_positions(tribe_id, data, pool, current_user)


@router.patch("/{tribe_id}/archive", status_code=status.HTTP_204_NO_CONTENT)
@require_any_permission_decorator(PermissionEnum.ADMIN, PermissionEnum.CAN_ACCESS_OWN_TRIBES)
async def archive_tribe(tribe_id: str, current_user: dict = Depends(get_current_user)):
    pool = get_database()
    tribe_id = await resolve_url_param_id(pool, "tribes", tribe_id)
    await check_own_tribe_position_or_admin(tribe_id, current_user, pool, required_position="manager")
    await tribe_service.archive_tribe(tribe_id, pool, current_user)
