from typing import List, Optional
from uuid import UUID

from fastapi import APIRouter, Depends
from pydantic import BaseModel

from app.core.database import get_database
from app.models.auth.auth import PermissionEnum
from app.models.crud.positions import PositionEnum
from app.routers.auth.authentification import get_current_user
from app.routers.auth.authorization import require_any_permission_decorator
from app.utils.db_helpers import resolve_url_param_id
from app.utils.ownership import check_own_user_or_admin

router = APIRouter(prefix="/projects", tags=["query_projects"])

_POSITION_RANK = {'guest': 0, 'member': 1, 'manager': 2}

_QUERY = """
    SELECT
        u.id        AS user_id,
        proj.id     AS project_id,
        proj.url_param_id AS project_url_param_id,
        proj.name   AS project_name,
        CASE LEAST(
            CASE pos.position WHEN 'guest' THEN 0 WHEN 'member' THEN 1 ELSE 2 END,
            CASE tp.relation  WHEN 'guest' THEN 0 WHEN 'member' THEN 1 ELSE 2 END
        )
        WHEN 0 THEN 'guest'
        WHEN 1 THEN 'member'
        ELSE 'manager'
        END         AS effective_position,
        FALSE       AS via_represents,
        NULL::text  AS person_first_name,
        NULL::text  AS person_last_name
    FROM users u
    JOIN persons        p   ON p.id  = u.person_id   AND p.status   = 'active'
    JOIN positions      pos ON pos.person_id = p.id   AND pos.status = 'active'
    JOIN tribes         t   ON t.id  = pos.tribe_id   AND t.status   = 'active'
    JOIN tribes_projects tp ON tp.tribe_id = t.id
    JOIN projects       proj ON proj.id = tp.project_id AND proj.status = 'active'
    WHERE u.id = $1

    UNION ALL

    SELECT
        u.id        AS user_id,
        proj.id     AS project_id,
        proj.url_param_id AS project_url_param_id,
        proj.name   AS project_name,
        CASE LEAST(
            CASE pos.position WHEN 'guest' THEN 0 WHEN 'member' THEN 1 ELSE 2 END,
            CASE tp.relation  WHEN 'guest' THEN 0 WHEN 'member' THEN 1 ELSE 2 END
        )
        WHEN 0 THEN 'guest'
        WHEN 1 THEN 'member'
        ELSE 'manager'
        END         AS effective_position,
        TRUE        AS via_represents,
        p.first_name AS person_first_name,
        p.last_name  AS person_last_name
    FROM users u
    JOIN represents     r   ON r.user_id = u.id       AND r.status   = 'active'
    JOIN persons        p   ON p.id = r.person_id      AND p.status   = 'active'
    JOIN positions      pos ON pos.person_id = p.id    AND pos.status = 'active'
    JOIN tribes         t   ON t.id = pos.tribe_id     AND t.status   = 'active'
    JOIN tribes_projects tp ON tp.tribe_id = t.id
    JOIN projects       proj ON proj.id = tp.project_id AND proj.status = 'active'
    WHERE u.id = $1
"""


class UserProjectEntry(BaseModel):
    user_id: str
    project_id: str
    project_url_param_id: str
    project_name: str
    effective_position: PositionEnum
    via_represents: bool
    person_first_name: Optional[str] = None
    person_last_name: Optional[str] = None


_QUERY_BY_TRIBE = """
    SELECT
        u.id        AS user_id,
        proj.id     AS project_id,
        proj.url_param_id AS project_url_param_id,
        proj.name   AS project_name,
        CASE LEAST(
            CASE pos.position WHEN 'guest' THEN 0 WHEN 'member' THEN 1 ELSE 2 END,
            CASE tp.relation  WHEN 'guest' THEN 0 WHEN 'member' THEN 1 ELSE 2 END
        )
        WHEN 0 THEN 'guest'
        WHEN 1 THEN 'member'
        ELSE 'manager'
        END         AS effective_position,
        FALSE       AS via_represents,
        NULL::text  AS person_first_name,
        NULL::text  AS person_last_name
    FROM users u
    JOIN persons        p   ON p.id  = u.person_id   AND p.status   = 'active'
    JOIN positions      pos ON pos.person_id = p.id   AND pos.status = 'active'
    JOIN tribes         t   ON t.id  = pos.tribe_id   AND t.status   = 'active'
    JOIN tribes_projects tp ON tp.tribe_id = t.id
    JOIN projects       proj ON proj.id = tp.project_id AND proj.status = 'active'
    WHERE u.id = $1 AND t.id = $2

    UNION ALL

    SELECT
        u.id        AS user_id,
        proj.id     AS project_id,
        proj.url_param_id AS project_url_param_id,
        proj.name   AS project_name,
        CASE LEAST(
            CASE pos.position WHEN 'guest' THEN 0 WHEN 'member' THEN 1 ELSE 2 END,
            CASE tp.relation  WHEN 'guest' THEN 0 WHEN 'member' THEN 1 ELSE 2 END
        )
        WHEN 0 THEN 'guest'
        WHEN 1 THEN 'member'
        ELSE 'manager'
        END         AS effective_position,
        TRUE        AS via_represents,
        p.first_name AS person_first_name,
        p.last_name  AS person_last_name
    FROM users u
    JOIN represents     r   ON r.user_id = u.id       AND r.status   = 'active'
    JOIN persons        p   ON p.id = r.person_id      AND p.status   = 'active'
    JOIN positions      pos ON pos.person_id = p.id    AND pos.status = 'active'
    JOIN tribes         t   ON t.id = pos.tribe_id     AND t.status   = 'active'
    JOIN tribes_projects tp ON tp.tribe_id = t.id
    JOIN projects       proj ON proj.id = tp.project_id AND proj.status = 'active'
    WHERE u.id = $1 AND t.id = $2
"""


def _deduplicate(rows, user_id: str) -> List[UserProjectEntry]:
    best: dict = {}
    for r in rows:
        key = (str(r["project_id"]), r["via_represents"], r["person_first_name"], r["person_last_name"])
        ep = r["effective_position"]
        if key not in best or _POSITION_RANK[ep] > _POSITION_RANK[best[key]["effective_position"]]:
            best[key] = {
                "project_id": str(r["project_id"]),
                "project_url_param_id": r["project_url_param_id"],
                "project_name": r["project_name"],
                "effective_position": ep,
                "via_represents": r["via_represents"],
                "person_first_name": r["person_first_name"],
                "person_last_name": r["person_last_name"],
            }
    return [UserProjectEntry(user_id=user_id, **entry) for entry in best.values()]


@router.get("/by/user/{user_id}", response_model=List[UserProjectEntry])
@require_any_permission_decorator(PermissionEnum.ADMIN, PermissionEnum.CAN_ACCESS_OWN_TRIBES)
async def get_projects_by_user(user_id: str, current_user: dict = Depends(get_current_user)):
    """Get all active projects accessible to a user, with effective position per path."""
    pool = get_database()
    user_id = await resolve_url_param_id(pool, "users", user_id)
    await check_own_user_or_admin(user_id, current_user, pool)

    async with pool.acquire() as conn:
        rows = await conn.fetch(_QUERY, UUID(user_id))

    return _deduplicate(rows, user_id)


class ProjectTribeEntry(BaseModel):
    tribe_id: str
    tribe_name: str


@router.get("/{project_id}/tribes", response_model=List[ProjectTribeEntry])
@require_any_permission_decorator(PermissionEnum.ADMIN)
async def get_tribes_for_project(
    project_id: str,
    current_user: dict = Depends(get_current_user),
):
    pool = get_database()
    project_id = await resolve_url_param_id(pool, "projects", project_id)
    async with pool.acquire() as conn:
        rows = await conn.fetch(
            """
            SELECT t.id AS tribe_id, t.name AS tribe_name
            FROM tribes t
            JOIN tribes_projects tp ON tp.tribe_id = t.id
            WHERE tp.project_id = $1
            ORDER BY t.name ASC
            """,
            UUID(project_id),
        )
    return [ProjectTribeEntry(tribe_id=str(r["tribe_id"]), tribe_name=r["tribe_name"]) for r in rows]


@router.get("/by/tribe/{tribe_id}/for/user/{user_id}", response_model=List[UserProjectEntry])
@require_any_permission_decorator(PermissionEnum.ADMIN, PermissionEnum.CAN_ACCESS_OWN_TRIBES)
async def get_projects_by_tribe_for_user(
    tribe_id: str,
    user_id: str,
    current_user: dict = Depends(get_current_user),
):
    """Get all active projects in a tribe accessible to a user, with effective position per path."""
    pool = get_database()
    user_id = await resolve_url_param_id(pool, "users", user_id)
    tribe_id = await resolve_url_param_id(pool, "tribes", tribe_id)
    await check_own_user_or_admin(user_id, current_user, pool)

    async with pool.acquire() as conn:
        rows = await conn.fetch(_QUERY_BY_TRIBE, UUID(user_id), UUID(tribe_id))

    return _deduplicate(rows, user_id)
