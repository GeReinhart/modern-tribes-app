from typing import Optional
from uuid import UUID

from fastapi import APIRouter, Depends, HTTPException, Query, status

from app.core.database import get_database
from app.models.app.project_features import (
    FeatureTypeInfo,
    ProjectFeatureInstanceCreate,
    ProjectFeatureInstanceResponse,
    ProjectFeatureInstanceUpdate,
)
from app.models.auth.auth import PermissionEnum
from app.routers.auth.authentification import get_current_user
from app.routers.auth.authorization import require_any_permission_decorator
from app.utils.db_helpers import resolve_url_param_id
from app.utils.project_access import check_project_access_or_admin

router = APIRouter(prefix="/project-features", tags=["app_project_features"])


@router.get("/feature-types", response_model=list[FeatureTypeInfo])
@require_any_permission_decorator(PermissionEnum.ADMIN, PermissionEnum.CAN_ACCESS_OWN_TRIBES)
async def get_feature_types(current_user: dict = Depends(get_current_user)):
    from features.registry import get_available_feature_types

    return [FeatureTypeInfo(**ft) for ft in get_available_feature_types()]


@router.get("/projects/{project_id}/features", response_model=list[ProjectFeatureInstanceResponse])
@require_any_permission_decorator(PermissionEnum.ADMIN, PermissionEnum.CAN_ACCESS_OWN_TRIBES)
async def list_project_features(
    project_id: str,
    status_filter: Optional[str] = Query(None, alias="status"),
    current_user: dict = Depends(get_current_user),
):
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
    return [
        ProjectFeatureInstanceResponse(
            id=str(r["id"]),
            project_id=str(r["project_id"]),
            feature_type=r["feature_type"],
            name=r["name"],
            status=r["status"],
            position=r["position"],
            created_at=r["created_at"],
            updated_at=r["updated_at"],
            created_by=str(r["created_by"]) if r["created_by"] else None,
            updated_by=str(r["updated_by"]) if r["updated_by"] else None,
        )
        for r in rows
    ]


@router.post(
    "/projects/{project_id}/features",
    response_model=ProjectFeatureInstanceResponse,
    status_code=status.HTTP_201_CREATED,
)
@require_any_permission_decorator(PermissionEnum.ADMIN, PermissionEnum.CAN_ACCESS_OWN_TRIBES)
async def create_project_feature(
    project_id: str, data: ProjectFeatureInstanceCreate, current_user: dict = Depends(get_current_user)
):
    pool = get_database()
    project_id = await resolve_url_param_id(pool, "projects", project_id)
    await check_project_access_or_admin(project_id, current_user, pool, min_position="manager")
    user_id = UUID(str(current_user["id"]))
    async with pool.acquire() as conn:
        row = await conn.fetchrow(
            """
            INSERT INTO projects_features (project_id, feature_type, name, position, created_by, updated_by)
            VALUES ($1, $2, $3, $4, $5, $5)
            RETURNING *
            """,
            UUID(project_id),
            data.feature_type,
            data.name,
            data.position,
            user_id,
        )
    return ProjectFeatureInstanceResponse(
        id=str(row["id"]),
        project_id=str(row["project_id"]),
        feature_type=row["feature_type"],
        name=row["name"],
        status=row["status"],
        position=row["position"],
        created_at=row["created_at"],
        updated_at=row["updated_at"],
        created_by=str(row["created_by"]) if row["created_by"] else None,
        updated_by=str(row["updated_by"]) if row["updated_by"] else None,
    )


@router.patch("/projects/{project_id}/features/{feature_id}", response_model=ProjectFeatureInstanceResponse)
@require_any_permission_decorator(PermissionEnum.ADMIN, PermissionEnum.CAN_ACCESS_OWN_TRIBES)
async def update_project_feature(
    project_id: str,
    feature_id: str,
    data: ProjectFeatureInstanceUpdate,
    current_user: dict = Depends(get_current_user),
):
    pool = get_database()
    project_id = await resolve_url_param_id(pool, "projects", project_id)
    await check_project_access_or_admin(project_id, current_user, pool, min_position="manager")
    user_id = UUID(str(current_user["id"]))
    updates: dict = {"updated_by": user_id}
    if data.name is not None:
        updates["name"] = data.name
    if data.status is not None:
        updates["status"] = data.status
    if data.position is not None:
        updates["position"] = data.position

    set_clauses = ", ".join(f"{k} = ${i+2}" for i, k in enumerate(updates.keys()))
    values = list(updates.values())

    async with pool.acquire() as conn:
        row = await conn.fetchrow(
            f"UPDATE projects_features SET {set_clauses} WHERE id = $1 AND project_id = ${len(values)+2} RETURNING *",
            UUID(feature_id),
            *values,
            UUID(project_id),
        )
    if not row:
        raise HTTPException(status_code=status.HTTP_404_NOT_FOUND, detail="Feature instance not found.")
    return ProjectFeatureInstanceResponse(
        id=str(row["id"]),
        project_id=str(row["project_id"]),
        feature_type=row["feature_type"],
        name=row["name"],
        status=row["status"],
        position=row["position"],
        created_at=row["created_at"],
        updated_at=row["updated_at"],
        created_by=str(row["created_by"]) if row["created_by"] else None,
        updated_by=str(row["updated_by"]) if row["updated_by"] else None,
    )
