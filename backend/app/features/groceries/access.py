from uuid import UUID

from fastapi import HTTPException, status

from app.platform.core.authorization.project_access import check_project_access_or_admin


async def require_feature_access(pool, feature_instance_id: str, user: dict, min_position: str = "guest") -> str:
    async with pool.acquire() as conn:
        row = await conn.fetchrow(
            "SELECT project_id FROM projects_features WHERE id = $1", UUID(feature_instance_id)
        )
    if not row:
        raise HTTPException(status_code=status.HTTP_404_NOT_FOUND, detail="Feature instance not found.")
    project_id = str(row["project_id"])
    await check_project_access_or_admin(project_id, user, pool, min_position=min_position)
    return project_id
