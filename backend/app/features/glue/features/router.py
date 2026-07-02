from typing import Optional
from uuid import UUID

from fastapi import APIRouter, Depends, HTTPException, Query, status

from app.platform.core.database import get_database
from app.features.glue.features.models import (
    FeatureTypeInfo,
    ProjectFeatureInstanceCreate,
    ProjectFeatureInstanceResponse,
    ProjectFeatureInstanceUpdate,
)
from app.platform.core.authorization.models import PermissionEnum
from app.platform.core.authentication.router import get_current_user
from app.platform.core.authorization.router import require_any_permission_decorator
from app.platform.core.utils.db_helpers import resolve_url_param_id
from app.platform.core.authorization.project_access import check_project_access_or_admin

router = APIRouter(prefix="/feature-instances", tags=["features_glue"])


def _row_to_response(row: dict) -> ProjectFeatureInstanceResponse:
    return ProjectFeatureInstanceResponse(
        id=str(row["id"]),
        project_id=str(row["project_id"]),
        feature_type=row["feature_type"],
        name=row["name"],
        icon=row["icon"],
        theme_code=row["theme_code"],
        status=row["status"],
        position=row["position"],
        created_at=row["created_at"],
        updated_at=row["updated_at"],
        created_by=str(row["created_by"]) if row["created_by"] else None,
        updated_by=str(row["updated_by"]) if row["updated_by"] else None,
    )


@router.get("/feature-types", response_model=list[FeatureTypeInfo])
@require_any_permission_decorator(PermissionEnum.ADMIN, PermissionEnum.CAN_ACCESS_OWN_TRIBES)
async def get_feature_types(current_user: dict = Depends(get_current_user)):
    """List all available feature types that can be added to a project.

    **Permissions:** admin | can_access_attached_tribes
    """
    from app.features.registry import get_available_feature_types

    return [FeatureTypeInfo(**ft) for ft in get_available_feature_types()]


@router.get("/projects/{project_id}/features", response_model=list[ProjectFeatureInstanceResponse])
@require_any_permission_decorator(PermissionEnum.ADMIN, PermissionEnum.CAN_ACCESS_OWN_TRIBES)
async def list_project_features(
    project_id: str,
    status_filter: Optional[str] = Query(None, alias="status"),
    current_user: dict = Depends(get_current_user),
):
    """List all feature instances for a project.

    **Permissions:** admin | can_access_attached_tribes
    **Project access:** minimum position ≥ guest
    """
    pool = get_database()
    project_id = await resolve_url_param_id(pool, "projects", project_id)
    await check_project_access_or_admin(project_id, current_user, pool, min_position="guest")
    if status_filter:
        query = "SELECT * FROM projects_features WHERE project_id = $1 AND status = $2 ORDER BY position ASC, created_at ASC"
        params = [UUID(project_id), status_filter]
    else:
        query = "SELECT * FROM projects_features WHERE project_id = $1 ORDER BY position ASC, created_at ASC"
        params = [UUID(project_id)]
    async with pool.acquire() as conn:
        rows = await conn.fetch(query, *params)
    return [_row_to_response(dict(r)) for r in rows]


@router.post(
    "/projects/{project_id}/features",
    response_model=ProjectFeatureInstanceResponse,
    status_code=status.HTTP_201_CREATED,
)
@require_any_permission_decorator(PermissionEnum.ADMIN, PermissionEnum.CAN_ACCESS_OWN_TRIBES)
async def create_project_feature(
    project_id: str, data: ProjectFeatureInstanceCreate, current_user: dict = Depends(get_current_user)
):
    """Add a new feature instance to a project.

    **Permissions:** admin | can_access_attached_tribes
    **Project access:** minimum position ≥ manager
    """
    pool = get_database()
    project_id = await resolve_url_param_id(pool, "projects", project_id)
    await check_project_access_or_admin(project_id, current_user, pool, min_position="manager")
    user_id = UUID(str(current_user["id"]))
    async with pool.acquire() as conn:
        row = await conn.fetchrow(
            """
            INSERT INTO projects_features (project_id, feature_type, name, icon, theme_code, position, created_by, updated_by)
            VALUES ($1, $2, $3, $4, $5, $6, $7, $7)
            RETURNING *
            """,
            UUID(project_id),
            data.feature_type,
            data.name,
            data.icon,
            data.theme_code,
            data.position,
            user_id,
        )
    return _row_to_response(dict(row))


def _build_feature_updates(data: ProjectFeatureInstanceUpdate, user_id: UUID) -> dict:
    updates: dict = {"updated_by": user_id}
    if data.name is not None:
        updates["name"] = data.name
    if data.status is not None:
        updates["status"] = data.status
    if data.position is not None:
        updates["position"] = data.position
    if "theme_code" in data.model_fields_set:
        updates["theme_code"] = data.theme_code
    if "icon" in data.model_fields_set:
        updates["icon"] = data.icon
    return updates


async def _assert_resulting_name_or_icon(conn, feature_id: str, updates: dict) -> None:
    """A tab must keep a name, an icon, or both after the update is applied."""
    if "name" not in updates and "icon" not in updates:
        return
    current = await conn.fetchrow("SELECT name, icon FROM projects_features WHERE id = $1", UUID(feature_id))
    resulting_name = updates.get("name", current["name"] if current else None)
    resulting_icon = updates.get("icon", current["icon"] if current else None)
    if not (resulting_name and resulting_name.strip()) and not resulting_icon:
        raise HTTPException(status_code=status.HTTP_400_BAD_REQUEST, detail="Either name or icon must be provided.")


@router.patch("/projects/{project_id}/features/{feature_id}", response_model=ProjectFeatureInstanceResponse)
@require_any_permission_decorator(PermissionEnum.ADMIN, PermissionEnum.CAN_ACCESS_OWN_TRIBES)
async def update_project_feature(
    project_id: str,
    feature_id: str,
    data: ProjectFeatureInstanceUpdate,
    current_user: dict = Depends(get_current_user),
):
    """Update a feature instance (name, icon, status, position).

    **Permissions:** admin | can_access_attached_tribes
    **Project access:** minimum position ≥ manager
    """
    pool = get_database()
    project_id = await resolve_url_param_id(pool, "projects", project_id)
    await check_project_access_or_admin(project_id, current_user, pool, min_position="manager")
    user_id = UUID(str(current_user["id"]))
    updates = _build_feature_updates(data, user_id)

    set_clauses = ", ".join(f"{k} = ${i+2}" for i, k in enumerate(updates.keys()))
    values = list(updates.values())

    async with pool.acquire() as conn:
        await _assert_resulting_name_or_icon(conn, feature_id, updates)
        row = await conn.fetchrow(
            f"UPDATE projects_features SET {set_clauses} WHERE id = $1 AND project_id = ${len(values)+2} RETURNING *",
            UUID(feature_id),
            *values,
            UUID(project_id),
        )
    if not row:
        raise HTTPException(status_code=status.HTTP_404_NOT_FOUND, detail="Feature instance not found.")
    return _row_to_response(dict(row))
