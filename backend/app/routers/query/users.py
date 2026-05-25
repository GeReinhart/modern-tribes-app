from typing import List

from fastapi import APIRouter, Depends, HTTPException, Query

from app.core.database import get_database
from app.models.auth.auth import PermissionEnum
from app.models.crud.users import UserSearchResult, UserWithPermissions
from app.repositories import user_repository as user_repo
from app.routers.auth.authentification import get_current_user
from app.routers.auth.authorization import require_permission_decorator

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


@router.get("/{user_id}/with/permissions", response_model=UserWithPermissions)
async def get_user_with_permissions(user_id: str):
    pool = get_database()
    user = await user_repo.get_user_with_roles_and_permissions(pool, user_id)
    if not user:
        raise HTTPException(status_code=404, detail=f"{ENTITY_NAME} not found")
    return user
