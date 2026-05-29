from typing import List

from fastapi import APIRouter, Depends, HTTPException, Query

from app.platform.core.database import get_database
from app.platform.core.authorization.models import PermissionEnum
from app.platform.functions.people.users.models import UserDisplayInfo, UserSearchResult, UserWithPermissions
from app.platform.functions.people.users import repository as user_repo
from app.platform.core.authentication.router import get_current_user
from app.platform.core.authorization.router import require_permission_decorator

router = APIRouter(prefix="/users", tags=["query_users"])

ENTITY_NAME = "User"


@router.get("/search", response_model=List[UserSearchResult])
@require_permission_decorator(PermissionEnum.ADMIN)
async def search_users(
    q: str = Query(min_length=1),
    current_user: dict = Depends(get_current_user),
):
    pool = get_database()
    return await user_repo.search_users(pool, q)


@router.get("/{user_id}/display", response_model=UserDisplayInfo)
async def get_user_display_info(
    user_id: str,
    _current_user: dict = Depends(get_current_user),
):
    pool = get_database()
    info = await user_repo.get_user_display_info(pool, user_id)
    if not info:
        raise HTTPException(status_code=404, detail=f"{ENTITY_NAME} not found")
    return info


@router.get("/{user_id}/with/permissions", response_model=UserWithPermissions)
async def get_user_with_permissions(user_id: str):
    pool = get_database()
    user = await user_repo.get_user_with_roles_and_permissions(pool, user_id)
    if not user:
        raise HTTPException(status_code=404, detail=f"{ENTITY_NAME} not found")
    return user
