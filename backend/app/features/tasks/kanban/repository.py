from datetime import date
from typing import Optional
from uuid import UUID

from app.features.tasks import reminder_repository


async def fetch_board(pool, feature_instance_id: str) -> dict:
    async with pool.acquire() as conn:
        cols = await conn.fetch(
            """SELECT id, name, position FROM kanban_columns
               WHERE feature_instance_id = $1 AND status = 'active'
               ORDER BY position ASC""",
            UUID(feature_instance_id),
        )
        cards = await conn.fetch(
            """SELECT kc.id, kc.feature_instance_id, kc.column_id,
                      kc.title, kc.assigned_person_id, kc.position, kc.status,
                      kc.document_id, kc.size, kc.due_date, kc.force_on_dashboard,
                      kc.created_at, kc.updated_at,
                      kc.created_by::text AS created_by,
                      kc.updated_by::text AS updated_by,
                      d.content_html AS document_content_html,
                      p.first_name || ' ' || p.last_name AS assigned_person_name,
                      ARRAY(
                          SELECT le.label_id::text
                          FROM label_entities le
                          WHERE le.entity_type = 'kanban_card' AND le.entity_id = kc.id
                      ) AS label_ids
               FROM kanban_cards kc
               LEFT JOIN documents d ON d.id = kc.document_id
               LEFT JOIN persons p ON p.id = kc.assigned_person_id
               WHERE kc.feature_instance_id = $1
               ORDER BY kc.position ASC""",
            UUID(feature_instance_id),
        )
        labels = await conn.fetch(
            """SELECT id::text, name, color, position FROM labels
               WHERE feature_instance_id = $1 AND status = 'active'
               ORDER BY position ASC""",
            UUID(feature_instance_id),
        )
        card_ids = [r["id"] for r in cards]
        reminders_map = await reminder_repository.fetch_reminders_map_conn(conn, 'kanban_card', card_ids)
    enriched_cards = []
    for r in cards:
        card = dict(r)
        card["reminders"] = reminders_map.get(str(r["id"]), [])
        enriched_cards.append(card)
    return {
        "columns": [dict(r) for r in cols],
        "cards": enriched_cards,
        "labels": [dict(r) for r in labels],
    }


async def fetch_columns_sorted(pool, feature_instance_id: str) -> list[dict]:
    async with pool.acquire() as conn:
        rows = await conn.fetch(
            "SELECT id, name, position FROM kanban_columns WHERE feature_instance_id = $1 AND status = 'active' ORDER BY position ASC",
            UUID(feature_instance_id),
        )
    return [dict(r) for r in rows]


async def fetch_column(pool, column_id: str) -> Optional[dict]:
    async with pool.acquire() as conn:
        row = await conn.fetchrow("SELECT * FROM kanban_columns WHERE id = $1", UUID(column_id))
    return dict(row) if row else None


async def insert_column(pool, feature_instance_id: str, name: str, position: int, user_id: str) -> dict:
    async with pool.acquire() as conn:
        row = await conn.fetchrow(
            "INSERT INTO kanban_columns (feature_instance_id, name, position, created_by, updated_by) VALUES ($1, $2, $3, $4, $4) RETURNING id, name, position",
            UUID(feature_instance_id),
            name,
            position,
            UUID(user_id),
        )
    return dict(row)


async def shift_columns_up(pool, feature_instance_id: str, from_position: int) -> None:
    async with pool.acquire() as conn:
        await conn.execute(
            "UPDATE kanban_columns SET position = position + 1 WHERE feature_instance_id = $1 AND position >= $2 AND status = 'active'",
            UUID(feature_instance_id),
            from_position,
        )


async def update_column(pool, column_id: str, name: str, user_id: str) -> Optional[dict]:
    async with pool.acquire() as conn:
        row = await conn.fetchrow(
            "UPDATE kanban_columns SET name = $1, updated_by = $2 WHERE id = $3 RETURNING id, name, position",
            name,
            UUID(user_id),
            UUID(column_id),
        )
    return dict(row) if row else None


async def delete_column(pool, column_id: str) -> None:
    async with pool.acquire() as conn:
        await conn.execute("DELETE FROM kanban_columns WHERE id = $1", UUID(column_id))


async def swap_column_positions(pool, col_id_a: str, col_id_b: str, user_id: str) -> None:
    async with pool.acquire() as conn:
        pos_a = await conn.fetchval("SELECT position FROM kanban_columns WHERE id = $1", UUID(col_id_a))
        pos_b = await conn.fetchval("SELECT position FROM kanban_columns WHERE id = $1", UUID(col_id_b))
        await conn.execute(
            "UPDATE kanban_columns SET position=$1, updated_by=$2 WHERE id=$3",
            pos_b,
            UUID(user_id),
            UUID(col_id_a),
        )
        await conn.execute(
            "UPDATE kanban_columns SET position=$1, updated_by=$2 WHERE id=$3",
            pos_a,
            UUID(user_id),
            UUID(col_id_b),
        )


async def fetch_card(pool, card_id: str) -> Optional[dict]:
    async with pool.acquire() as conn:
        row = await conn.fetchrow(
            """SELECT kc.id, kc.feature_instance_id, kc.column_id,
                      kc.title, kc.assigned_person_id, kc.position, kc.status,
                      kc.document_id, kc.size, kc.due_date, kc.force_on_dashboard,
                      kc.created_at, kc.updated_at,
                      kc.created_by::text AS created_by,
                      kc.updated_by::text AS updated_by,
                      d.content_html AS document_content_html,
                      p.first_name || ' ' || p.last_name AS assigned_person_name,
                      ARRAY(
                          SELECT le.label_id::text
                          FROM label_entities le
                          WHERE le.entity_type = 'kanban_card' AND le.entity_id = kc.id
                      ) AS label_ids
               FROM kanban_cards kc
               LEFT JOIN documents d ON d.id = kc.document_id
               LEFT JOIN persons p ON p.id = kc.assigned_person_id
               WHERE kc.id = $1""",
            UUID(card_id),
        )
        if not row:
            return None
        reminders_map = await reminder_repository.fetch_reminders_map_conn(conn, 'kanban_card', [row["id"]])
    result = dict(row)
    result["reminders"] = reminders_map.get(str(row["id"]), [])
    return result


async def insert_card(
    pool,
    feature_instance_id: str,
    column_id: str,
    title: str,
    assigned_person_id: Optional[str],
    position: int,
    user_id: str,
    force_on_dashboard: bool = False,
) -> dict:
    async with pool.acquire() as conn:
        row = await conn.fetchrow(
            """INSERT INTO kanban_cards
               (feature_instance_id, column_id, title, assigned_person_id, position, force_on_dashboard, created_by, updated_by)
               VALUES ($1, $2, $3, $4, $5, $6, $7, $7) RETURNING id""",
            UUID(feature_instance_id),
            UUID(column_id),
            title,
            UUID(assigned_person_id) if assigned_person_id else None,
            position,
            force_on_dashboard,
            UUID(user_id),
        )
    return await fetch_card(pool, str(row["id"]))


async def update_card_fields(
    pool,
    card_id: str,
    title: Optional[str],
    assigned_person_id: Optional[str],
    clear_assignee: bool,
    size: Optional[int],
    clear_size: bool,
    due_date: Optional[date],
    clear_due_date: bool,
    force_on_dashboard: Optional[bool],
    user_id: str,
) -> None:
    async with pool.acquire() as conn:
        if title is not None:
            await conn.execute(
                "UPDATE kanban_cards SET title = $1, updated_by = $2 WHERE id = $3",
                title,
                UUID(user_id),
                UUID(card_id),
            )
        if clear_assignee:
            await conn.execute(
                "UPDATE kanban_cards SET assigned_person_id = NULL, updated_by = $1 WHERE id = $2",
                UUID(user_id),
                UUID(card_id),
            )
        elif assigned_person_id is not None:
            await conn.execute(
                "UPDATE kanban_cards SET assigned_person_id = $1, updated_by = $2 WHERE id = $3",
                UUID(assigned_person_id),
                UUID(user_id),
                UUID(card_id),
            )
        if clear_size:
            await conn.execute(
                "UPDATE kanban_cards SET size = NULL, updated_by = $1 WHERE id = $2",
                UUID(user_id),
                UUID(card_id),
            )
        elif size is not None:
            await conn.execute(
                "UPDATE kanban_cards SET size = $1, updated_by = $2 WHERE id = $3",
                size,
                UUID(user_id),
                UUID(card_id),
            )
        if clear_due_date:
            await conn.execute(
                "UPDATE kanban_cards SET due_date = NULL, updated_by = $1 WHERE id = $2",
                UUID(user_id),
                UUID(card_id),
            )
        elif due_date is not None:
            await conn.execute(
                "UPDATE kanban_cards SET due_date = $1, updated_by = $2 WHERE id = $3",
                due_date,
                UUID(user_id),
                UUID(card_id),
            )
        if force_on_dashboard is not None:
            await conn.execute(
                "UPDATE kanban_cards SET force_on_dashboard = $1, updated_by = $2 WHERE id = $3",
                force_on_dashboard,
                UUID(user_id),
                UUID(card_id),
            )


async def set_card_document(pool, card_id: str, document_id: str, user_id: str) -> None:
    async with pool.acquire() as conn:
        await conn.execute(
            "UPDATE kanban_cards SET document_id = $1, updated_by = $2 WHERE id = $3",
            UUID(document_id),
            UUID(user_id),
            UUID(card_id),
        )


async def archive_card(pool, card_id: str, user_id: str) -> None:
    async with pool.acquire() as conn:
        await conn.execute(
            "UPDATE kanban_cards SET status = 'archived', updated_by = $1 WHERE id = $2 OR parent_card_id = $2",
            UUID(user_id),
            UUID(card_id),
        )


async def restore_card(pool, card_id: str, user_id: str) -> None:
    async with pool.acquire() as conn:
        await conn.execute(
            "UPDATE kanban_cards SET status = 'active', updated_by = $1 WHERE id = $2",
            UUID(user_id),
            UUID(card_id),
        )


async def move_card_to_column(pool, card_id: str, column_id: str, user_id: str) -> None:
    async with pool.acquire() as conn:
        await conn.execute(
            "UPDATE kanban_cards SET column_id = $1, updated_by = $2 WHERE id = $3",
            UUID(column_id),
            UUID(user_id),
            UUID(card_id),
        )


async def _apply_reorder(conn, cards: list[dict], idx: int, direction: str, user_id: str) -> list:
    if direction == "top":
        if idx == 0:
            return []
        new_pos = cards[0]["position"] - 1
        await conn.execute(
            "UPDATE kanban_cards SET position=$1, updated_by=$2 WHERE id=$3",
            new_pos,
            UUID(user_id),
            cards[idx]["id"],
        )
        return [cards[idx]["id"]]
    if direction == "bottom":
        if idx == len(cards) - 1:
            return []
        new_pos = cards[-1]["position"] + 1
        await conn.execute(
            "UPDATE kanban_cards SET position=$1, updated_by=$2 WHERE id=$3",
            new_pos,
            UUID(user_id),
            cards[idx]["id"],
        )
        return [cards[idx]["id"]]
    target_idx = idx - 1 if direction == "up" else idx + 1
    if target_idx < 0 or target_idx >= len(cards):
        return []
    pos_a, pos_b = cards[idx]["position"], cards[target_idx]["position"]
    await conn.execute(
        "UPDATE kanban_cards SET position=$1, updated_by=$2 WHERE id=$3",
        pos_b,
        UUID(user_id),
        cards[idx]["id"],
    )
    await conn.execute(
        "UPDATE kanban_cards SET position=$1, updated_by=$2 WHERE id=$3",
        pos_a,
        UUID(user_id),
        cards[target_idx]["id"],
    )
    return [cards[idx]["id"], cards[target_idx]["id"]]


async def move_card_to_last_column(pool, card_id: str, user_id: str) -> Optional[dict]:
    async with pool.acquire() as conn:
        card_row = await conn.fetchrow(
            "SELECT id, feature_instance_id FROM kanban_cards WHERE id = $1 AND status = 'active'",
            UUID(card_id),
        )
        if not card_row:
            return None
        last_col = await conn.fetchrow(
            "SELECT id FROM kanban_columns WHERE feature_instance_id = $1 AND status = 'active' ORDER BY position DESC LIMIT 1",
            card_row["feature_instance_id"],
        )
        if not last_col:
            return None
        await conn.execute(
            "UPDATE kanban_cards SET column_id = $1, updated_by = $2 WHERE id = $3",
            last_col["id"],
            UUID(user_id),
            UUID(card_id),
        )
    return await fetch_card(pool, card_id)


async def reorder_card_in_column(pool, card_id: str, direction: str, user_id: str) -> list[dict]:
    async with pool.acquire() as conn:
        card_row = await conn.fetchrow(
            "SELECT id, column_id, position FROM kanban_cards WHERE id = $1 AND status = 'active'",
            UUID(card_id),
        )
        if not card_row:
            return []
        rows = await conn.fetch(
            "SELECT id, position FROM kanban_cards WHERE column_id = $1 AND status = 'active' ORDER BY position ASC",
            card_row["column_id"],
        )
        cards = [dict(r) for r in rows]
        idx = next((i for i, c in enumerate(cards) if str(c["id"]) == card_id), None)
        if idx is None:
            return []
        affected_ids = await _apply_reorder(conn, cards, idx, direction, user_id)
    return [c for c in [await fetch_card(pool, str(aid)) for aid in affected_ids] if c]
