from uuid import UUID


async def fetch_persons_for_feature(pool, feature_instance_id: str, user_id: str) -> list[dict]:
    async with pool.acquire() as conn:
        rows = await conn.fetch(
            """SELECT DISTINCT p.id, p.first_name || ' ' || p.last_name AS name, p.photo_url
               FROM projects_features pf
               JOIN tribes_projects tp ON tp.project_id = pf.project_id
               JOIN positions pos ON pos.tribe_id = tp.tribe_id
                   AND pos.status = 'active'
                   AND pos.position IN ('manager', 'member')
               JOIN persons p ON p.id = pos.person_id AND p.status = 'active'
               WHERE pf.id = $1
               UNION
               SELECT p.id, p.first_name || ' ' || p.last_name AS name, p.photo_url
               FROM users u
               JOIN persons p ON p.id = u.person_id AND p.status = 'active'
               WHERE u.id = $2
               ORDER BY name ASC""",
            UUID(feature_instance_id),
            UUID(user_id),
        )
    return [{"id": str(r["id"]), "name": r["name"], "photo_url": r["photo_url"]} for r in rows]


async def get_photo_url(pool, person_id: str) -> str | None:
    async with pool.acquire() as conn:
        return await conn.fetchval("SELECT photo_url FROM persons WHERE id = $1", UUID(person_id))


async def set_photo_url(pool, person_id: str, photo_url: str | None, user_id: str) -> None:
    async with pool.acquire() as conn:
        await conn.execute(
            "UPDATE persons SET photo_url = $1, updated_by = $2 WHERE id = $3",
            photo_url, UUID(user_id), UUID(person_id),
        )
