from typing import Optional
from uuid import UUID

from fastapi import HTTPException, status

from app.models.auth.auth import PermissionEnum
from app.utils.db_helpers import resolve_url_param_id
from app.utils.permissions_helper import get_user_permissions

_POSITION_ORDER = {'guest': 0, 'member': 1, 'manager': 2}


async def get_project_position(project_id: str, user_id: UUID, pool) -> Optional[str]:
    """Return the highest position the user holds on the project (via direct or represents)."""
    async with pool.acquire() as conn:
        rows = await conn.fetch(
            """
            SELECT pos.position
            FROM positions pos
            JOIN persons p ON p.id = pos.person_id AND p.status = 'active'
            JOIN users u ON u.person_id = p.id
            JOIN tribes_projects tp ON tp.tribe_id = pos.tribe_id
            WHERE u.id = $1 AND tp.project_id = $2 AND pos.status = 'active'

            UNION

            SELECT pos.position
            FROM positions pos
            JOIN represents r ON r.person_id = pos.person_id AND r.status = 'active'
            JOIN tribes_projects tp ON tp.tribe_id = pos.tribe_id
            WHERE r.user_id = $1 AND tp.project_id = $2 AND pos.status = 'active'
            """,
            user_id, UUID(project_id)
        )
    if not rows:
        return None
    positions = [r["position"] for r in rows]
    return max(positions, key=lambda p: _POSITION_ORDER.get(p, -1))


async def check_project_access_or_admin(
    project_id: str,
    current_user: dict,
    pool,
    min_position: str = 'guest',
) -> str:
    """
    Verify current_user has at least min_position on the project.
    Returns the effective position string.
    Raises 403 if access is denied.
    """
    project_id = await resolve_url_param_id(pool, "projects", project_id)
    user_id = UUID(str(current_user["id"]))
    user_permissions = await get_user_permissions(pool, str(user_id))

    if PermissionEnum.ADMIN in user_permissions:
        return 'manager'

    position = await get_project_position(project_id, user_id, pool)
    if position is None:
        raise HTTPException(status_code=status.HTTP_403_FORBIDDEN, detail="You do not have access to this project.")

    required_level = _POSITION_ORDER.get(min_position, 0)
    effective_level = _POSITION_ORDER.get(position, -1)
    if effective_level < required_level:
        raise HTTPException(
            status_code=status.HTTP_403_FORBIDDEN,
            detail=f"You must be at least {min_position} to perform this action.",
        )

    return position
