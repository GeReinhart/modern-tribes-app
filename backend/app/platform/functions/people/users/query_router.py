from typing import List

from fastapi import APIRouter, Depends, HTTPException, Query, status

from app.platform.core.database import get_database
from app.platform.core.authorization.models import PermissionEnum
from app.platform.core.authorization.permissions import get_user_permissions
from app.platform.functions.people.users.models import UserDisplayInfo, UserSearchResult, UserWithPermissions
from app.platform.functions.people.users import repository as user_repo
from app.platform.core.authentication.router import get_current_user

router = APIRouter(prefix="/users", tags=["platform_people"])

ENTITY_NAME = "User"


@router.get("/search", response_model=List[UserSearchResult])
async def search_users(
    q: str = Query(min_length=1),
    current_user: dict = Depends(get_current_user),
):
    """Search users by login or email.

    **Permissions:** admin
    """
    pool = get_database()
    user_perms = await get_user_permissions(pool, str(current_user["id"]))
    if PermissionEnum.ADMIN not in user_perms:
        raise HTTPException(status_code=status.HTTP_403_FORBIDDEN, detail="Permission required: admin")
    return await user_repo.search_users(pool, q)


@router.get("/{user_id}/display", response_model=UserDisplayInfo)
async def get_user_display_info(
    user_id: str,
    _current_user: dict = Depends(get_current_user),
):
    """Get display information for a user (name, avatar).

    **Permissions:** authentication required — no specific permission
    """
    pool = get_database()
    info = await user_repo.get_user_display_info(pool, user_id)
    if not info:
        raise HTTPException(status_code=404, detail=f"{ENTITY_NAME} not found")
    return info


@router.get("/{user_id}/with/permissions", response_model=UserWithPermissions)
async def get_user_with_permissions(user_id: str):
    """Get a user with their resolved permissions (internal use).

    **Public** — no authentication required
    """
    pool = get_database()
    user = await user_repo.get_user_with_roles_and_permissions(pool, user_id)
    if not user:
        raise HTTPException(status_code=404, detail=f"{ENTITY_NAME} not found")
    return user
