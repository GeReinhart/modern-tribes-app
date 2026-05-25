from datetime import datetime
from typing import Optional
from uuid import UUID

from fastapi import APIRouter, Depends, Query
from pydantic import BaseModel

from app.core.database import get_database
from app.models.auth.auth import PermissionEnum
from app.routers.auth.authentification import get_current_user
from app.routers.auth.authorization import require_any_permission_decorator

router = APIRouter(prefix="/features", tags=["query_features"])


class AdminFeatureEntry(BaseModel):
    id: str
    project_id: str
    project_name: str
    feature_type: str
    name: str
    status: str
    position: int
    created_at: datetime
    updated_at: datetime


@router.get("/", response_model=list[AdminFeatureEntry])
@require_any_permission_decorator(PermissionEnum.ADMIN)
async def list_all_features(
    status: Optional[str] = Query(None),
    feature_type: Optional[str] = Query(None),
    current_user: dict = Depends(get_current_user),
):
    pool = get_database()
    conditions = []
    params: list = []

    if status:
        params.append(status)
        conditions.append(f"pf.status = ${len(params)}")
    if feature_type:
        params.append(feature_type)
        conditions.append(f"pf.feature_type = ${len(params)}")

    where = ("WHERE " + " AND ".join(conditions)) if conditions else ""

    async with pool.acquire() as conn:
        rows = await conn.fetch(
            f"""
            SELECT pf.id, pf.project_id, proj.name AS project_name,
                   pf.feature_type, pf.name, pf.status, pf.position,
                   pf.created_at, pf.updated_at
            FROM projects_features pf
            JOIN projects proj ON proj.id = pf.project_id
            {where}
            ORDER BY pf.created_at DESC
            """,
            *params,
        )
    return [
        AdminFeatureEntry(
            id=str(r["id"]),
            project_id=str(r["project_id"]),
            project_name=r["project_name"],
            feature_type=r["feature_type"],
            name=r["name"],
            status=r["status"],
            position=r["position"],
            created_at=r["created_at"],
            updated_at=r["updated_at"],
        )
        for r in rows
    ]


@router.patch("/{feature_id}/status")
@require_any_permission_decorator(PermissionEnum.ADMIN)
async def set_feature_status(
    feature_id: str,
    status: str = Query(..., pattern="^(active|archived)$"),
    current_user: dict = Depends(get_current_user),
):
    pool = get_database()
    async with pool.acquire() as conn:
        await conn.execute(
            "UPDATE projects_features SET status = $1, updated_by = $2 WHERE id = $3",
            status,
            UUID(str(current_user["id"])),
            UUID(feature_id),
        )
    return {"status": status}
