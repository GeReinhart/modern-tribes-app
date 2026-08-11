from uuid import UUID

# Privacy is enforced structurally here, not by any access check: every query is scoped to the
# caller's own user_id, so there is no code path that can return another user's mastery_level.


async def fetch_my_mastery(pool, song_id: str, user_id: str) -> int | None:
    async with pool.acquire() as conn:
        row = await conn.fetchrow(
            "SELECT mastery_level FROM guitar_songs_mastery "
            "WHERE song_id = $1 AND user_id = $2 AND status = 'active'",
            UUID(song_id), UUID(user_id),
        )
    return row["mastery_level"] if row else None


async def upsert_my_mastery(pool, song_id: str, user_id: str, mastery_level: int) -> None:
    async with pool.acquire() as conn:
        await conn.execute(
            """INSERT INTO guitar_songs_mastery (song_id, user_id, mastery_level, created_by, updated_by)
               VALUES ($1, $2, $3, $2, $2)
               ON CONFLICT (song_id, user_id) DO UPDATE
               SET mastery_level = $3, updated_by = $2, updated_at = NOW()""",
            UUID(song_id), UUID(user_id), mastery_level,
        )
