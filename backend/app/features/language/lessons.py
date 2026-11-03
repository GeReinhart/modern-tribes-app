"""Persistence for a project's language settings, its lessons, and which words belong to
each lesson. Shared by the lesson, learn and test sub-packages — a lesson belongs to a
project, not to one tab instance, so all three read and write the exact same rows."""
from uuid import UUID


async def get_language_settings(pool, project_id: str) -> dict | None:
    async with pool.acquire() as conn:
        row = await conn.fetchrow(
            "SELECT project_id::text, source_language, target_language FROM language_settings "
            "WHERE project_id = $1 AND status = 'active'",
            UUID(project_id),
        )
    return dict(row) if row else None


async def language_code_exists(pool, code: str) -> bool:
    async with pool.acquire() as conn:
        row = await conn.fetchrow("SELECT code FROM languages WHERE code = $1 AND status = 'active'", code)
    return row is not None


async def list_languages(pool) -> list[dict]:
    async with pool.acquire() as conn:
        rows = await conn.fetch(
            "SELECT code, name, theme_code FROM languages WHERE status = 'active' ORDER BY name",
        )
    return [dict(r) for r in rows]


async def update_language_theme(pool, code: str, theme_code: str | None, user_id: str) -> dict | None:
    async with pool.acquire() as conn:
        row = await conn.fetchrow(
            """UPDATE languages SET theme_code = $1, updated_by = $2 WHERE code = $3 AND status = 'active'
               RETURNING code, name, theme_code""",
            theme_code, UUID(user_id), code,
        )
    return dict(row) if row else None


async def create_language_settings(
    pool, project_id: str, source_language: str, target_language: str, user_id: str,
) -> dict:
    async with pool.acquire() as conn:
        row = await conn.fetchrow(
            """INSERT INTO language_settings (project_id, source_language, target_language, created_by, updated_by)
               VALUES ($1, $2, $3, $4, $4)
               RETURNING project_id::text, source_language, target_language""",
            UUID(project_id), source_language, target_language, UUID(user_id),
        )
    return dict(row)


async def create_lesson(pool, project_id: str, title: str, document_id: str, user_id: str) -> dict:
    async with pool.acquire() as conn:
        row = await conn.fetchrow(
            """INSERT INTO language_lessons (project_id, title, document_id, created_by, updated_by)
               VALUES ($1, $2, $3, $4, $4)
               RETURNING id::text, project_id::text, title, document_id::text, created_at, updated_at""",
            UUID(project_id), title, UUID(document_id), UUID(user_id),
        )
    return dict(row)


async def get_lesson(pool, lesson_id: str) -> dict | None:
    async with pool.acquire() as conn:
        row = await conn.fetchrow(
            "SELECT id::text, project_id::text, title, document_id::text, created_at, updated_at "
            "FROM language_lessons WHERE id = $1 AND status = 'active'",
            UUID(lesson_id),
        )
    return dict(row) if row else None


async def update_lesson_title(pool, lesson_id: str, title: str, user_id: str) -> None:
    async with pool.acquire() as conn:
        await conn.execute(
            "UPDATE language_lessons SET title = $1, updated_by = $2 WHERE id = $3",
            title, UUID(user_id), UUID(lesson_id),
        )


async def is_word_in_lesson(pool, lesson_id: str, word_id: str) -> bool:
    async with pool.acquire() as conn:
        row = await conn.fetchrow(
            "SELECT id FROM language_lesson_words WHERE lesson_id = $1 AND word_id = $2 AND status = 'active'",
            UUID(lesson_id), UUID(word_id),
        )
    return row is not None


async def add_word_to_lesson(pool, lesson_id: str, word_id: str, user_id: str) -> None:
    async with pool.acquire() as conn:
        position = await conn.fetchval(
            "SELECT COALESCE(MAX(position), -1) + 1 FROM language_lesson_words "
            "WHERE lesson_id = $1 AND status = 'active'",
            UUID(lesson_id),
        )
        await conn.execute(
            """INSERT INTO language_lesson_words (lesson_id, word_id, position, created_by, updated_by)
               VALUES ($1, $2, $3, $4, $4)""",
            UUID(lesson_id), UUID(word_id), position, UUID(user_id),
        )


async def remove_word_from_lesson(pool, lesson_id: str, word_id: str, user_id: str) -> None:
    """Detach a word from a lesson (soft: the link is archived, the word itself is untouched)."""
    async with pool.acquire() as conn:
        await conn.execute(
            """UPDATE language_lesson_words SET status = 'archived', updated_by = $3
               WHERE lesson_id = $1 AND word_id = $2 AND status = 'active'""",
            UUID(lesson_id), UUID(word_id), UUID(user_id),
        )


async def count_lesson_words(pool, lesson_id: str) -> int:
    async with pool.acquire() as conn:
        return await conn.fetchval(
            "SELECT COUNT(*) FROM language_lesson_words WHERE lesson_id = $1 AND status = 'active'",
            UUID(lesson_id),
        )


async def list_lessons_for_project(pool, project_id: str) -> list[dict]:
    async with pool.acquire() as conn:
        rows = await conn.fetch(
            "SELECT id::text, project_id::text, title, created_at, updated_at FROM language_lessons "
            "WHERE project_id = $1 AND status = 'active' ORDER BY created_at",
            UUID(project_id),
        )
    return [dict(r) for r in rows]


async def list_lesson_word_ids(pool, lesson_id: str) -> list[dict]:
    """Word ids in a lesson, in display order, each with its word_type (used for the
    multiple-choice pool and for the learn view)."""
    async with pool.acquire() as conn:
        rows = await conn.fetch(
            """SELECT w.id::text, w.word_type
               FROM language_lesson_words lw
               JOIN language_words w ON w.id = lw.word_id AND w.status = 'active'
               WHERE lw.lesson_id = $1 AND lw.status = 'active'
               ORDER BY lw.position""",
            UUID(lesson_id),
        )
    return [dict(r) for r in rows]
