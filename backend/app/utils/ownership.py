from typing import Optional
from uuid import UUID

from fastapi import HTTPException, status

from .db_helpers import get_document_by_id, row_to_dict
from .permissions_helper import get_user_permissions
from ..models.auth.auth import PermissionEnum


async def check_own_user_or_admin(user_id: str, current_user: dict, pool) -> None:
    if str(current_user.get("id")) == user_id:
        return
    permissions = await get_user_permissions(pool, str(current_user.get("id")))
    if PermissionEnum.ADMIN not in permissions:
        raise HTTPException(status_code=status.HTTP_403_FORBIDDEN, detail="We do not allow access to other users' data.")


async def check_own_person_or_admin(person_id: str, current_user: dict, pool) -> None:
    permissions = await get_user_permissions(pool, str(current_user.get("id")))
    if PermissionEnum.ADMIN in permissions:
        return
    async with pool.acquire() as conn:
        row = await conn.fetchrow("SELECT * FROM users WHERE person_id = $1", UUID(person_id))
    if not row or str(row.get("id")) != str(current_user.get("id")):
        raise HTTPException(
            status_code=status.HTTP_403_FORBIDDEN,
            detail="You do not have permission to access this person's data."
        )


async def check_own_tribe_position_or_admin(
    tribe_id: str, current_user: dict, pool,
    required_position: Optional[str] = None
) -> None:
    permissions = await get_user_permissions(pool, str(current_user.get("id")))
    if PermissionEnum.ADMIN in permissions:
        return

    user_doc = await get_document_by_id(pool, "users", str(current_user.get("id")), "User")
    if not user_doc:
        raise HTTPException(status_code=status.HTTP_401_UNAUTHORIZED, detail="User not found")

    person_id = user_doc.get("person_id")
    async with pool.acquire() as conn:
        row = await conn.fetchrow(
            "SELECT * FROM positions WHERE tribe_id = $1 AND person_id = $2",
            UUID(tribe_id), UUID(person_id)
        )

    if not row:
        raise HTTPException(status_code=status.HTTP_403_FORBIDDEN, detail="You are not a member of this tribe.")

    position = row_to_dict(row)
    if required_position and position.get("position") != required_position:
        raise HTTPException(
            status_code=status.HTTP_403_FORBIDDEN,
            detail=f"You must be a {required_position} to perform this action."
        )
