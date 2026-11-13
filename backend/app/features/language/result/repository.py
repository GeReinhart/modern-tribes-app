from uuid import UUID


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

async def list_answering_users(pool, lesson_id: str) -> list[dict]:
    """Everyone who answered a test on one of the lesson's words (or on their translations) and
    did not leave the project's competition, by name -- whether or not they hold a position on
    a tribe of the project."""
    async with pool.acquire() as conn:
        rows = await conn.fetch(
            """SELECT DISTINCT u.id::text AS user_id,
                      COALESCE(p.first_name || ' ' || p.last_name, u.email) AS name
               FROM language_word_test_attempts a
               JOIN users u ON u.id = a.user_id AND u.status = 'active'
               LEFT JOIN persons p ON p.id = u.person_id
               LEFT JOIN language_competition_participation cp ON cp.user_id = u.id
                 AND cp.project_id = (SELECT project_id FROM language_lessons WHERE id = $1)
               WHERE a.status = 'active' AND COALESCE(cp.participates, TRUE) AND a.word_id IN (
                   SELECT lw.word_id FROM language_lesson_words lw
                   WHERE lw.lesson_id = $1 AND lw.status = 'active'
                   UNION
                   SELECT CASE WHEN t.word_id_a = lw.word_id THEN t.word_id_b ELSE t.word_id_a END
                   FROM language_lesson_words lw
                   JOIN language_word_translations t
                     ON (t.word_id_a = lw.word_id OR t.word_id_b = lw.word_id) AND t.status = 'active'
                   WHERE lw.lesson_id = $1 AND lw.status = 'active')
               ORDER BY name""",
            UUID(lesson_id),
        )
    return [dict(r) for r in rows]


async def get_participates(pool, project_id: str, user_id: str) -> bool:
    """Whether the user takes part in the project's competition (yes until they choose otherwise)."""
    async with pool.acquire() as conn:
        value = await conn.fetchval(
            "SELECT participates FROM language_competition_participation WHERE project_id = $1 AND user_id = $2",
            UUID(project_id), UUID(user_id),
        )
    return True if value is None else value


async def set_participates(pool, project_id: str, user_id: str, participates: bool) -> None:
    async with pool.acquire() as conn:
        await conn.execute(
            """INSERT INTO language_competition_participation(project_id, user_id, participates)
               VALUES($1, $2, $3)
               ON CONFLICT (project_id, user_id) DO UPDATE SET participates = EXCLUDED.participates""",
            UUID(project_id), UUID(user_id), participates,
        )
