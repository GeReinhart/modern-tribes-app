from uuid import UUID

_ACCESSIBLE_PROJECTS_WITH_TRIBES_QUERY = """
    SELECT DISTINCT ON (project_id)
        project_id, project_url_param_id, project_name, tribe_url_param_id, tribe_name
    FROM (
        SELECT proj.id::text AS project_id, proj.url_param_id AS project_url_param_id, proj.name AS project_name,
               t.url_param_id AS tribe_url_param_id, t.name AS tribe_name
        FROM users u
        JOIN persons p ON p.id = u.person_id AND p.status = 'active'
        JOIN positions pos ON pos.person_id = p.id AND pos.status = 'active'
        JOIN tribes t ON t.id = pos.tribe_id AND t.status = 'active'
        JOIN tribes_projects tp ON tp.tribe_id = t.id
        JOIN projects proj ON proj.id = tp.project_id AND proj.status = 'active'
        WHERE u.id = $1

        UNION

        SELECT proj.id::text AS project_id, proj.url_param_id AS project_url_param_id, proj.name AS project_name,
               t.url_param_id AS tribe_url_param_id, t.name AS tribe_name
        FROM users u
        JOIN represents r ON r.user_id = u.id AND r.status = 'active'
        JOIN persons p ON p.id = r.person_id AND p.status = 'active'
        JOIN positions pos ON pos.person_id = p.id AND pos.status = 'active'
        JOIN tribes t ON t.id = pos.tribe_id AND t.status = 'active'
        JOIN tribes_projects tp ON tp.tribe_id = t.id
        JOIN projects proj ON proj.id = tp.project_id AND proj.status = 'active'
        WHERE u.id = $1
    ) sub
    ORDER BY project_id, tribe_name ASC
"""


async def fetch_accessible_projects_with_tribes(pool, user_id: str) -> list[dict]:
    async with pool.acquire() as conn:
        rows = await conn.fetch(_ACCESSIBLE_PROJECTS_WITH_TRIBES_QUERY, UUID(user_id))
    return [dict(r) for r in rows]
