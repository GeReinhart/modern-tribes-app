from uuid import UUID

from app.features.guitar.song import position_utils

_VIDEO_SELECT_FIELDS = (
    "id::text, song_id::text, title, url, position, status, "
    "created_at, updated_at, created_by::text, updated_by::text"
)


async def fetch_video_context(pool, video_id: str) -> dict | None:
    async with pool.acquire() as conn:
        row = await conn.fetchrow(
            """SELECT v.id::text, v.song_id::text, s.project_id::text AS project_id
               FROM guitar_songs_videos v JOIN guitar_songs s ON s.id = v.song_id
               WHERE v.id = $1""",
            UUID(video_id),
        )
    return dict(row) if row else None


async def fetch_videos(pool, song_id: str) -> list[dict]:
    async with pool.acquire() as conn:
        rows = await conn.fetch(
            f"SELECT {_VIDEO_SELECT_FIELDS} FROM guitar_songs_videos "
            "WHERE song_id = $1 AND status = 'active' ORDER BY position ASC",
            UUID(song_id),
        )
    return [dict(row) for row in rows]


async def fetch_video(pool, video_id: str) -> dict | None:
    async with pool.acquire() as conn:
        row = await conn.fetchrow(
            f"SELECT {_VIDEO_SELECT_FIELDS} FROM guitar_songs_videos WHERE id = $1", UUID(video_id)
        )
    return dict(row) if row else None


async def next_video_position(pool, song_id: str) -> int:
    async with pool.acquire() as conn:
        return await conn.fetchval(
            "SELECT COALESCE(MAX(position), 0) + 1 FROM guitar_songs_videos "
            "WHERE song_id = $1 AND status = 'active'",
            UUID(song_id),
        )


async def insert_video(pool, song_id: str, title: str | None, url: str, position: int, user_id: str) -> str:
    async with pool.acquire() as conn:
        row = await conn.fetchrow(
            """INSERT INTO guitar_songs_videos (song_id, title, url, position, created_by, updated_by)
               VALUES ($1, $2, $3, $4, $5::uuid, $5::uuid) RETURNING id::text""",
            UUID(song_id), title, url, position, UUID(user_id),
        )
    return row["id"]


async def update_video(pool, video_id: str, updates: dict, user_id: str) -> None:
    if not updates:
        return
    fields = {**updates, "updated_by": UUID(user_id)}
    set_clauses = []
    params: list = []
    for key, value in fields.items():
        params.append(value)
        set_clauses.append(f"{key} = ${len(params)}")
    params.append(UUID(video_id))
    async with pool.acquire() as conn:
        await conn.execute(
            f"UPDATE guitar_songs_videos SET {', '.join(set_clauses)}, updated_at = NOW() "
            f"WHERE id = ${len(params)}",
            *params,
        )


async def archive_video(pool, video_id: str, user_id: str) -> None:
    async with pool.acquire() as conn:
        await conn.execute(
            "UPDATE guitar_songs_videos SET status = 'archived', updated_by = $1::uuid, updated_at = NOW() "
            "WHERE id = $2",
            UUID(user_id), UUID(video_id),
        )


async def fetch_videos_sorted(pool, song_id: str) -> list[dict]:
    return await position_utils.fetch_ids_sorted_by_position(pool, "guitar_songs_videos", "song_id", song_id)


async def swap_video_positions(pool, id_a: str, id_b: str, user_id: str) -> None:
    await position_utils.swap_positions(pool, "guitar_songs_videos", id_a, id_b, user_id)
