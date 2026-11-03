from uuid import UUID


async def record_attempt(pool, user_id: str, word_id: str, direction: str, mode: str, correct: bool) -> None:
    async with pool.acquire() as conn:
        await conn.execute(
            """INSERT INTO language_word_test_attempts
                   (user_id, word_id, direction, mode, correct, created_by, updated_by)
               VALUES ($1, $2, $3, $4, $5, $1, $1)""",
            UUID(user_id), UUID(word_id), direction, mode, correct,
        )


async def get_word_attempts(pool, user_id: str, word_id: str) -> list[dict]:
    """A word's attempts: those recorded on it, plus the reverse-direction ones recorded on
    its translations -- in the reverse direction (and for articles of the learned-language noun)
    the translation is the word shown, so the attempt is stored under the translation's id but
    is knowledge of this word."""
    async with pool.acquire() as conn:
        rows = await conn.fetch(
            """SELECT direction, mode, correct, created_at FROM language_word_test_attempts
               WHERE user_id = $1 AND status = 'active' AND (
                   word_id = $2
                   OR (direction IN ('target_to_source', 'article', 'plural') AND word_id IN (
                       SELECT CASE WHEN word_id_a = $2 THEN word_id_b ELSE word_id_a END
                       FROM language_word_translations
                       WHERE (word_id_a = $2 OR word_id_b = $2) AND status = 'active'
                   ))
               )
               ORDER BY created_at""",
            UUID(user_id), UUID(word_id),
        )
    return [dict(r) for r in rows]


async def find_lesson_word_for_translation(pool, lesson_id: str, translation_id: str) -> str | None:
    """The lesson word that `translation_id` translates, if any (the first one found)."""
    async with pool.acquire() as conn:
        return await conn.fetchval(
            """SELECT lw.word_id::text FROM language_lesson_words lw
               JOIN language_word_translations t ON t.status = 'active'
                   AND ((t.word_id_a = lw.word_id AND t.word_id_b = $2)
                        OR (t.word_id_b = lw.word_id AND t.word_id_a = $2))
               WHERE lw.lesson_id = $1 AND lw.status = 'active'
               ORDER BY lw.position LIMIT 1""",
            UUID(lesson_id), UUID(translation_id),
        )


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


_NOUN_FACTS = ("article", "plural")


async def find_noun_entry(pool, word_id: str, language: str, fact: str) -> dict | None:
    """The noun that has an `fact` (article or plural), in `language`, standing for a lesson
    word: the word itself or one of its translations. That fact is what its test asks for."""
    if fact not in _NOUN_FACTS:
        raise ValueError(f"Unknown noun fact: {fact}")
    async with pool.acquire() as conn:
        row = await conn.fetchrow(
            f"""SELECT w.id::text, w.text, w.{fact} FROM language_words w
               WHERE w.status = 'active' AND w.language = $2 AND w.word_type = 'noun'
                 AND COALESCE(w.{fact}, '') <> '' AND (
                     w.id = $1 OR w.id IN (
                         SELECT CASE WHEN word_id_a = $1 THEN word_id_b ELSE word_id_a END
                         FROM language_word_translations
                         WHERE (word_id_a = $1 OR word_id_b = $1) AND status = 'active'))
               LIMIT 1""",
            UUID(word_id), language,
        )
    return dict(row) if row else None
