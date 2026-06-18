from uuid import UUID

from fastapi import HTTPException, status

from app.platform.core.authorization.models import PermissionEnum
from app.platform.core.authorization.permissions import get_user_permissions
from app.platform.core.utils.db_helpers import resolve_url_param_id


async def check_own_user_or_admin(user_id: str, current_user: dict, pool) -> None:
    user_id = await resolve_url_param_id(pool, "users", user_id)
    if str(current_user.get("id")) == user_id:
        return
    permissions = await get_user_permissions(pool, str(current_user.get("id")))
    if PermissionEnum.ADMIN in permissions or PermissionEnum.CAN_MANAGE_PEOPLE in permissions:
        return
    raise HTTPException(
        status_code=status.HTTP_403_FORBIDDEN, detail="We do not allow access to other users' data."
    )


async def check_own_person_or_admin(person_id: str, current_user: dict, pool) -> None:
    permissions = await get_user_permissions(pool, str(current_user.get("id")))
    if PermissionEnum.ADMIN in permissions or PermissionEnum.CAN_MANAGE_PEOPLE in permissions:
        return
    async with pool.acquire() as conn:
        row = await conn.fetchrow("SELECT id FROM users WHERE person_id = $1", UUID(person_id))
        if row and str(row.get("id")) == str(current_user.get("id")):
            return
        represents_row = await conn.fetchrow(
            "SELECT id FROM represents WHERE user_id = $1 AND person_id = $2",
            UUID(str(current_user.get("id"))),
            UUID(person_id),
        )
    if not represents_row:
        raise HTTPException(
            status_code=status.HTTP_403_FORBIDDEN,
            detail="You do not have permission to access this person's data.",
        )


