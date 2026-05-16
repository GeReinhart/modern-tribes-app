from fastapi import APIRouter, Depends, HTTPException
from typing import List
from uuid import UUID
from pydantic import BaseModel

from ..auth.authentification import get_current_user
from ..auth.authorization import require_any_permission_decorator
from ...utils.ownership import check_own_user_or_admin
from ...models.auth.auth import PermissionEnum
from ...models.crud.positions import PositionEnum
from ...core.database import get_database
from ...utils.db_helpers import validate_uuid

router = APIRouter(prefix="/tribes", tags=["query_tribes"])

_QUERY = """
    SELECT
        u.id        AS user_id,
        u.login     AS user_login,
        u.email     AS user_email,
        p.id        AS person_id,
        p.first_name AS person_first_name,
        p.last_name  AS person_last_name,
        pos.position AS position,
        t.id        AS tribe_id,
        t.name      AS tribe_name
    FROM users u
    JOIN persons   p   ON p.id  = u.person_id  AND p.status   = 'active'
    JOIN positions pos ON pos.person_id = p.id  AND pos.status = 'active'
    JOIN tribes    t   ON t.id  = pos.tribe_id  AND t.status   = 'active'
    WHERE u.id = $1
"""


class UserPersonPositionTribe(BaseModel):
    user_id: str
    user_login: str
    user_email: str
    person_id: str
    person_first_name: str
    person_last_name: str
    position: PositionEnum
    tribe_id: str
    tribe_name: str


@router.get("/by/user/{user_id}", response_model=List[UserPersonPositionTribe])
@require_any_permission_decorator(PermissionEnum.ADMIN, PermissionEnum.CAN_ACCESS_OWN_TRIBES)
async def get_tribes_by_user(user_id: str, current_user: dict = Depends(get_current_user)):
    """Get all active tribes associated with a user via their active positions."""
    validate_uuid(user_id, "user_id")
    pool = get_database()
    await check_own_user_or_admin(user_id, current_user, pool)

    async with pool.acquire() as conn:
        rows = await conn.fetch(_QUERY, UUID(user_id))

    return [
        UserPersonPositionTribe(
            user_id=str(r["user_id"]),
            user_login=r["user_login"],
            user_email=r["user_email"],
            person_id=str(r["person_id"]),
            person_first_name=r["person_first_name"],
            person_last_name=r["person_last_name"],
            position=r["position"],
            tribe_id=str(r["tribe_id"]),
            tribe_name=r["tribe_name"],
        )
        for r in rows
    ]
