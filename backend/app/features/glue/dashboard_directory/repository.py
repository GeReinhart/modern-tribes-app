from uuid import UUID


async def fetch_feature_instances_for_projects(
    pool, project_ids: list[str], feature_types: list[str]
) -> list[dict]:
    if not project_ids:
        return []
    async with pool.acquire() as conn:
        rows = await conn.fetch(
            """
            SELECT id::text AS feature_instance_id, feature_type, name AS instance_name,
                   project_id::text AS project_id
            FROM projects_features
            WHERE status = 'active'
            AND project_id = ANY($1::uuid[])
            AND feature_type = ANY($2::text[])
            """,
            [UUID(pid) for pid in project_ids],
            feature_types,
        )
    return [dict(r) for r in rows]


async def fetch_kanban_open_counts(pool, feature_instance_ids: list[str]) -> dict[str, int]:
    if not feature_instance_ids:
        return {}
    async with pool.acquire() as conn:
        rows = await conn.fetch(
            """
            SELECT c.feature_instance_id::text AS feature_instance_id, COUNT(*) AS open_count
            FROM kanban_cards c
            JOIN kanban_columns col ON col.id = c.column_id AND col.status = 'active'
            WHERE c.status = 'active'
            AND c.feature_instance_id = ANY($1::uuid[])
            AND col.position < (
                SELECT MAX(kc2.position) FROM kanban_columns kc2
                WHERE kc2.feature_instance_id = c.feature_instance_id AND kc2.status = 'active'
            )
            GROUP BY c.feature_instance_id
            """,
            [UUID(fid) for fid in feature_instance_ids],
        )
    return {r["feature_instance_id"]: r["open_count"] for r in rows}


async def fetch_todo_open_counts(pool, feature_instance_ids: list[str]) -> dict[str, int]:
    if not feature_instance_ids:
        return {}
    async with pool.acquire() as conn:
        rows = await conn.fetch(
            """
            SELECT i.feature_instance_id::text AS feature_instance_id, COUNT(*) AS open_count
            FROM todo_items i
            WHERE i.status = 'active' AND i.todo_status = 'todo'
            AND i.feature_instance_id = ANY($1::uuid[])
            GROUP BY i.feature_instance_id
            """,
            [UUID(fid) for fid in feature_instance_ids],
        )
    return {r["feature_instance_id"]: r["open_count"] for r in rows}


async def fetch_upcoming_event_counts(pool, feature_instance_ids: list[str]) -> dict[str, int]:
    if not feature_instance_ids:
        return {}
    async with pool.acquire() as conn:
        rows = await conn.fetch(
            """
            SELECT e.feature_instance_id::text AS feature_instance_id, COUNT(*) AS upcoming_count
            FROM events e
            WHERE e.status = 'active' AND e.start_at >= NOW()
            AND e.feature_instance_id = ANY($1::uuid[])
            GROUP BY e.feature_instance_id
            """,
            [UUID(fid) for fid in feature_instance_ids],
        )
    return {r["feature_instance_id"]: r["upcoming_count"] for r in rows}
