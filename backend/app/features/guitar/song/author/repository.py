from uuid import UUID

_AUTHOR_SELECT_FIELDS = (
    "id::text, project_id::text, name, status, created_at, updated_at, created_by::text, updated_by::text"
)


async def fetch_authors(pool, project_id: str) -> list[dict]:
    async with pool.acquire() as conn:
        rows = await conn.fetch(
            f"SELECT {_AUTHOR_SELECT_FIELDS} FROM guitar_song_author "
            "WHERE project_id = $1 AND status = 'active' ORDER BY name ASC",
            UUID(project_id),
        )
    return [dict(row) for row in rows]


async def find_author_by_name(pool, project_id: str, name: str) -> dict | None:
    async with pool.acquire() as conn:
        row = await conn.fetchrow(
            f"SELECT {_AUTHOR_SELECT_FIELDS} FROM guitar_song_author "
            "WHERE project_id = $1 AND name = $2 AND status = 'active'",
            UUID(project_id), name,
        )
    return dict(row) if row else None


async def fetch_author(pool, author_id: str) -> dict | None:
    async with pool.acquire() as conn:
        row = await conn.fetchrow(
            f"SELECT {_AUTHOR_SELECT_FIELDS} FROM guitar_song_author WHERE id = $1", UUID(author_id)
        )
    return dict(row) if row else None


async def insert_author(pool, project_id: str, name: str, user_id: str) -> dict:
    async with pool.acquire() as conn:
        row = await conn.fetchrow(
            f"""INSERT INTO guitar_song_author (project_id, name, created_by, updated_by)
               VALUES ($1, $2, $3::uuid, $3::uuid) RETURNING {_AUTHOR_SELECT_FIELDS}""",
            UUID(project_id), name, UUID(user_id),
        )
    return dict(row)
