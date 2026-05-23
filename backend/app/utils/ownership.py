from typing import Optional
from uuid import UUID

from fastapi import HTTPException, status

from .db_helpers import get_document_by_id, row_to_dict, resolve_url_param_id
from .permissions_helper import get_user_permissions
from ..models.auth.auth import PermissionEnum


async def check_own_user_or_admin(user_id: str, current_user: dict, pool) -> None:
    user_id = await resolve_url_param_id(pool, "users", user_id)
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
        row = await conn.fetchrow("SELECT id FROM users WHERE person_id = $1", UUID(person_id))
        if row and str(row.get("id")) == str(current_user.get("id")):
            return
        represents_row = await conn.fetchrow(
            "SELECT id FROM represents WHERE user_id = $1 AND person_id = $2",
            UUID(str(current_user.get("id"))), UUID(person_id)
        )
    if not represents_row:
        raise HTTPException(
            status_code=status.HTTP_403_FORBIDDEN,
            detail="You do not have permission to access this person's data."
        )


async def check_own_tribe_position_or_admin(
    tribe_id: str, current_user: dict, pool,
    required_position: Optional[str] = None
) -> None:
    tribe_id = await resolve_url_param_id(pool, "tribes", tribe_id)
    permissions = await get_user_permissions(pool, str(current_user.get("id")))
    if PermissionEnum.ADMIN in permissions:
        return

    user_doc = await get_document_by_id(pool, "users", str(current_user.get("id")), "User")
    if not user_doc:
        raise HTTPException(status_code=status.HTTP_401_UNAUTHORIZED, detail="User not found")

    user_id = UUID(str(current_user.get("id")))
    person_id = user_doc.get("person_id")

    async with pool.acquire() as conn:
        # Direct membership via the user's own person
        direct_rows = await conn.fetch(
            "SELECT position FROM positions WHERE tribe_id = $1 AND person_id = $2",
            UUID(tribe_id), UUID(person_id)
        )
        # Membership via the represents relation
        represents_rows = await conn.fetch(
            """
            SELECT pos.position FROM positions pos
            JOIN represents r ON r.person_id = pos.person_id AND r.status = 'active'
            WHERE pos.tribe_id = $1 AND r.user_id = $2
            """,
            UUID(tribe_id), user_id
        )

    all_positions = [r["position"] for r in direct_rows] + [r["position"] for r in represents_rows]

    if not all_positions:
        raise HTTPException(status_code=status.HTTP_403_FORBIDDEN, detail="You are not a member of this tribe.")

    if required_position and required_position not in all_positions:
        raise HTTPException(
            status_code=status.HTTP_403_FORBIDDEN,
            detail=f"You must be a {required_position} to perform this action."
        )
