"""Persistence of the precomputed daily results (see snapshots.py)."""
from datetime import date
from uuid import UUID


async def list_snapshots(pool, lesson_id: str, user_id: str) -> list[dict]:
    async with pool.acquire() as conn:
        rows = await conn.fetch(
            """SELECT day, score, success, errors, last_attempt_at FROM language_result_snapshots
               WHERE lesson_id = $1 AND user_id = $2 ORDER BY day""",
            UUID(lesson_id), UUID(user_id),
        )
    return [dict(r) for r in rows]


async def last_attempt_at(pool, user_id: str):
    """When the person last answered any test (None if never)."""
    async with pool.acquire() as conn:
        return await conn.fetchval(
            "SELECT MAX(created_at) FROM language_word_test_attempts WHERE user_id = $1 AND status = 'active'",
            UUID(user_id),
        )


async def last_final_day(pool, lesson_id: str, user_id: str, today: date) -> date | None:
    """The latest stored day before today: stored days before today never change."""
    async with pool.acquire() as conn:
        return await conn.fetchval(
            "SELECT MAX(day) FROM language_result_snapshots WHERE lesson_id = $1 AND user_id = $2 AND day < $3",
            UUID(lesson_id), UUID(user_id), today,
        )


async def upsert_snapshots(pool, lesson_id: str, user_id: str, rows: list[dict]) -> None:
    async with pool.acquire() as conn:
        await conn.executemany(
            """INSERT INTO language_result_snapshots (lesson_id, user_id, day, score, success, errors, last_attempt_at)
               VALUES ($1, $2, $3, $4, $5, $6, $7)
               ON CONFLICT (lesson_id, user_id, day) DO UPDATE
               SET score = $4, success = $5, errors = $6, last_attempt_at = $7""",
            [
                (UUID(lesson_id), UUID(user_id), r["day"], r["score"], r["success"], r["errors"], r["last_attempt_at"])
                for r in rows
            ],
        )


async def delete_for_lesson(pool, lesson_id: str) -> None:
    """Forget every stored day of a lesson (its words changed, so past scores change too)."""
    async with pool.acquire() as conn:
        await conn.execute("DELETE FROM language_result_snapshots WHERE lesson_id = $1", UUID(lesson_id))
