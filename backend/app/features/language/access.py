from uuid import UUID

from fastapi import HTTPException

from app.platform.core.authorization.project_access import check_project_access_or_admin


async def get_lesson_project_id(pool, lesson_id: str) -> str:
    """Resolve a lesson's project, or raise 404 if it doesn't exist (or was archived)."""
    async with pool.acquire() as conn:
        row = await conn.fetchrow(
            "SELECT project_id::text FROM language_lessons WHERE id = $1 AND status = 'active'",
            UUID(lesson_id),
        )
    if row is None:
        raise HTTPException(status_code=404, detail="Lesson not found")
    return row["project_id"]


async def check_lesson_access(pool, lesson_id: str, current_user: dict, min_position: str = "guest") -> str:
    """Verify current_user has at least min_position on the lesson's project.

    Shared by the lesson, learn and test sub-packages so every tab enforces the same
    project-level access rule on the project's shared lessons.
    """
    project_id = await get_lesson_project_id(pool, lesson_id)
    return await check_project_access_or_admin(project_id, current_user, pool, min_position)
