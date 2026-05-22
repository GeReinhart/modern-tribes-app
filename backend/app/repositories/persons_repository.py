from uuid import UUID


async def fetch_persons_for_feature(pool, feature_instance_id: str) -> list[dict]:
    async with pool.acquire() as conn:
        rows = await conn.fetch(
            """SELECT DISTINCT p.id, p.first_name || ' ' || p.last_name AS name
               FROM projects_features pf
               JOIN tribes_projects tp ON tp.project_id = pf.project_id
               JOIN positions pos ON pos.tribe_id = tp.tribe_id
                   AND pos.status = 'active'
                   AND pos.position IN ('manager', 'member')
               JOIN persons p ON p.id = pos.person_id AND p.status = 'active'
               WHERE pf.id = $1
               ORDER BY name ASC""",
            UUID(feature_instance_id),
        )
    return [{"id": str(r["id"]), "name": r["name"]} for r in rows]
