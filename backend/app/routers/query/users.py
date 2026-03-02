from fastapi import APIRouter, HTTPException

from ...models.crud.users import UserWithPermissions
from ...core.database import get_database
from ...repositories import user_repository as user_repo

router = APIRouter(prefix="/users", tags=["query_users"])

ENTITY_NAME = "User"


@router.get("/{user_id}/with/permissions", response_model=UserWithPermissions)
async def get_user_with_permissions(user_id: str):
    pool = get_database()
    user = await user_repo.get_user_with_roles_and_permissions(pool, user_id)
    if not user:
        raise HTTPException(status_code=404, detail=f"{ENTITY_NAME} not found")
    return user
