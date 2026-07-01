from datetime import date
from uuid import UUID


async def fetch_accessible_dates_for_month(pool, user_id: str, year: int, month: int) -> list[date]:
    async with pool.acquire() as conn:
        rows = await conn.fetch(
            """SELECT DISTINCT jb.date
               FROM journal_blocks jb
               JOIN projects_features pf ON pf.id = jb.feature_instance_id AND pf.status = 'active'
                   AND pf.feature_type = 'daily_journal'
               JOIN projects p ON p.id = pf.project_id AND p.status = 'active'
               WHERE jb.status = 'active'
               AND EXTRACT(YEAR FROM jb.date) = $2
               AND EXTRACT(MONTH FROM jb.date) = $3
               AND EXISTS (
                   SELECT 1 FROM positions pos
                   JOIN represents r ON r.person_id = pos.person_id AND r.status = 'active'
                   JOIN tribes_projects tp ON tp.tribe_id = pos.tribe_id
                   WHERE r.user_id = $1 AND tp.project_id = p.id AND pos.status = 'active'
               )
               ORDER BY jb.date""",
            UUID(user_id), year, month,
        )
    return [r["date"] for r in rows]


async def fetch_all_dates_for_month(pool, year: int, month: int) -> list[date]:
    async with pool.acquire() as conn:
        rows = await conn.fetch(
            """SELECT DISTINCT jb.date
               FROM journal_blocks jb
               JOIN projects_features pf ON pf.id = jb.feature_instance_id AND pf.status = 'active'
                   AND pf.feature_type = 'daily_journal'
               WHERE jb.status = 'active'
               AND EXTRACT(YEAR FROM jb.date) = $1
               AND EXTRACT(MONTH FROM jb.date) = $2
               ORDER BY jb.date""",
            year, month,
        )
    return [r["date"] for r in rows]


async def fetch_accessible_journal_summary(pool, user_id: str, day: date) -> list[dict]:
    async with pool.acquire() as conn:
        rows = await conn.fetch(
            """SELECT pf.id AS feature_instance_id, pf.name AS feature_instance_name,
                      p.id AS project_id, p.name AS project_name,
                      COUNT(jb.id) AS block_count
               FROM projects_features pf
               JOIN projects p ON p.id = pf.project_id AND p.status = 'active'
               JOIN journal_blocks jb ON jb.feature_instance_id = pf.id
                   AND jb.date = $2 AND jb.status = 'active'
               WHERE pf.feature_type = 'daily_journal' AND pf.status = 'active'
               AND (
                   EXISTS (
                       SELECT 1 FROM positions pos
                       JOIN represents r ON r.person_id = pos.person_id AND r.status = 'active'
                       JOIN tribes_projects tp ON tp.tribe_id = pos.tribe_id
                       WHERE r.user_id = $1 AND tp.project_id = p.id AND pos.status = 'active'
                   )
               )
               GROUP BY pf.id, pf.name, p.id, p.name
               HAVING COUNT(jb.id) > 0
               ORDER BY p.name, pf.name""",
            UUID(user_id), day,
        )
    return [dict(r) for r in rows]


async def fetch_all_journal_summary(pool, day: date) -> list[dict]:
    async with pool.acquire() as conn:
        rows = await conn.fetch(
            """SELECT pf.id AS feature_instance_id, pf.name AS feature_instance_name,
                      p.id AS project_id, p.name AS project_name,
                      COUNT(jb.id) AS block_count
               FROM projects_features pf
               JOIN projects p ON p.id = pf.project_id AND p.status = 'active'
               JOIN journal_blocks jb ON jb.feature_instance_id = pf.id
                   AND jb.date = $1 AND jb.status = 'active'
               WHERE pf.feature_type = 'daily_journal' AND pf.status = 'active'
               GROUP BY pf.id, pf.name, p.id, p.name
               HAVING COUNT(jb.id) > 0
               ORDER BY p.name, pf.name""",
            day,
        )
    return [dict(r) for r in rows]
