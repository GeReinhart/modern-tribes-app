from uuid import UUID

_ENTITY_TABLES = {'todo_item': 'todo_items', 'kanban_card': 'kanban_cards'}


async def fetch_reminders_map_conn(conn, entity_type: str, entity_ids: list) -> dict:
    if not entity_ids:
        return {}
    rows = await conn.fetch(
        """SELECT id, entity_id, remind_at, reminder_type, sent
           FROM reminders
           WHERE entity_type = $1 AND entity_id = ANY($2) AND status = 'active'
           ORDER BY remind_at ASC""",
        entity_type, entity_ids,
    )
    result: dict = {}
    for r in rows:
        eid = str(r["entity_id"])
        result.setdefault(eid, []).append({
            "id": str(r["id"]),
            "entity_type": entity_type,
            "entity_id": eid,
            "remind_at": r["remind_at"],
            "reminder_type": r["reminder_type"],
            "sent": r["sent"],
        })
    return result


async def get_active_reminder_ids(pool, entity_type: str, entity_id: str) -> list[str]:
    async with pool.acquire() as conn:
        rows = await conn.fetch(
            "SELECT id FROM reminders WHERE entity_type = $1 AND entity_id = $2 AND status = 'active'",
            entity_type, UUID(entity_id),
        )
    return [str(r["id"]) for r in rows]


async def set_reminders(pool, entity_type: str, entity_id: str, reminders: list[dict], user_id: str) -> list[dict]:
    eid = UUID(entity_id)
    uid = UUID(user_id)
    async with pool.acquire() as conn:
        await conn.execute(
            "UPDATE reminders SET status = 'archived', updated_by = $1 WHERE entity_type = $2 AND entity_id = $3",
            uid, entity_type, eid,
        )
        new_reminders = []
        for r in reminders:
            row = await conn.fetchrow(
                """INSERT INTO reminders (entity_type, entity_id, remind_at, reminder_type, created_by, updated_by)
                   VALUES ($1, $2, $3, $4, $5, $5) RETURNING id, entity_id, remind_at, reminder_type""",
                entity_type, eid, r["remind_at"], r["reminder_type"], uid,
            )
            new_reminders.append({
                "id": str(row["id"]),
                "entity_type": entity_type,
                "entity_id": str(row["entity_id"]),
                "remind_at": row["remind_at"],
                "reminder_type": row["reminder_type"],
                "sent": False,
            })
    return new_reminders


async def fetch_due_task_reminders(pool) -> list[dict]:
    async with pool.acquire() as conn:
        rows = await conn.fetch(
            """SELECT r.id, r.entity_type, r.entity_id, r.reminder_type,
                      COALESCE(t.title, k.title) AS task_title
               FROM reminders r
               LEFT JOIN todo_items t ON r.entity_type = 'todo_item' AND r.entity_id = t.id AND t.status = 'active'
               LEFT JOIN kanban_cards k ON r.entity_type = 'kanban_card' AND r.entity_id = k.id AND k.status = 'active'
               WHERE r.entity_type IN ('todo_item', 'kanban_card')
                 AND r.remind_at <= NOW()
                 AND r.sent = FALSE
                 AND r.status = 'active'
                 AND (t.id IS NOT NULL OR k.id IS NOT NULL)""",
        )
    return [dict(r) for r in rows]


async def mark_reminder_sent(pool, reminder_id: str) -> None:
    async with pool.acquire() as conn:
        await conn.execute(
            "UPDATE reminders SET sent = TRUE, updated_at = NOW() WHERE id = $1",
            UUID(reminder_id),
        )


async def _fetch_users_for_table(conn, table: str, entity_id: UUID) -> list[dict]:
    rows = await conn.fetch(
        f"""SELECT DISTINCT u.id AS user_id
            FROM users u
            JOIN (SELECT created_by, assigned_person_id FROM {table} WHERE id = $1) t ON true
            WHERE u.status = 'active'
              AND (
                u.id = t.created_by
                OR (t.assigned_person_id IS NOT NULL AND EXISTS (
                    SELECT 1 FROM represents r2
                    WHERE r2.user_id = u.id AND r2.person_id = t.assigned_person_id AND r2.status = 'active'
                ))
              )""",
        entity_id,
    )
    return [dict(r) for r in rows]


async def fetch_notifiable_users(pool, entity_type: str, entity_id: str) -> list[dict]:
    table = _ENTITY_TABLES[entity_type]
    async with pool.acquire() as conn:
        return await _fetch_users_for_table(conn, table, UUID(entity_id))


async def fetch_task_title(pool, entity_type: str, entity_id: str) -> str:
    table = _ENTITY_TABLES[entity_type]
    async with pool.acquire() as conn:
        title = await conn.fetchval(f"SELECT title FROM {table} WHERE id = $1", UUID(entity_id))
    return title or ""
