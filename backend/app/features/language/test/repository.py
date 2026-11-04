from uuid import UUID


async def record_attempt(pool, user_id: str, word_id: str, direction: str, mode: str, correct: bool) -> None:
    async with pool.acquire() as conn:
        await conn.execute(
            """INSERT INTO language_word_test_attempts
                   (user_id, word_id, direction, mode, correct, created_by, updated_by)
               VALUES ($1, $2, $3, $4, $5, $1, $1)""",
            UUID(user_id), UUID(word_id), direction, mode, correct,
        )


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
