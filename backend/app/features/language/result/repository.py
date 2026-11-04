from uuid import UUID


async def list_project_members(pool, project_id: str) -> list[dict]:
    """Active users holding a position on a tribe attached to the project, by name."""
    async with pool.acquire() as conn:
        rows = await conn.fetch(
            """SELECT DISTINCT u.id::text AS user_id, p.first_name || ' ' || p.last_name AS name
               FROM positions pos
               JOIN persons p ON p.id = pos.person_id AND p.status = 'active'
               JOIN users u ON u.person_id = p.id AND u.status = 'active'
               JOIN tribes_projects tp ON tp.tribe_id = pos.tribe_id
               WHERE tp.project_id = $1 AND pos.status = 'active'
               ORDER BY name""",
            UUID(project_id),
        )
    return [dict(r) for r in rows]