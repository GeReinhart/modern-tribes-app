from typing import Optional
from uuid import UUID


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
                      kc.document_id, d.content_html AS document_content_html,
                      p.first_name || ' ' || p.last_name AS assigned_person_name
               FROM kanban_cards kc
               LEFT JOIN documents d ON d.id = kc.document_id
               LEFT JOIN persons p ON p.id = kc.assigned_person_id
               WHERE kc.feature_instance_id = $1
               ORDER BY kc.position ASC""",
            UUID(feature_instance_id),
        )
    return {"columns": [dict(r) for r in cols], "cards": [dict(r) for r in cards]}


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
            UUID(feature_instance_id), name, position, UUID(user_id),
        )
    return dict(row)


async def shift_columns_up(pool, feature_instance_id: str, from_position: int) -> None:
    async with pool.acquire() as conn:
        await conn.execute(
            "UPDATE kanban_columns SET position = position + 1 WHERE feature_instance_id = $1 AND position >= $2 AND status = 'active'",
            UUID(feature_instance_id), from_position,
        )


async def update_column(pool, column_id: str, name: str, user_id: str) -> Optional[dict]:
    async with pool.acquire() as conn:
        row = await conn.fetchrow(
            "UPDATE kanban_columns SET name = $1, updated_by = $2 WHERE id = $3 RETURNING id, name, position",
            name, UUID(user_id), UUID(column_id),
        )
    return dict(row) if row else None


async def delete_column(pool, column_id: str) -> None:
    async with pool.acquire() as conn:
        await conn.execute("DELETE FROM kanban_columns WHERE id = $1", UUID(column_id))


async def swap_column_positions(pool, col_id_a: str, col_id_b: str, user_id: str) -> None:
    async with pool.acquire() as conn:
        pos_a = await conn.fetchval("SELECT position FROM kanban_columns WHERE id = $1", UUID(col_id_a))
        pos_b = await conn.fetchval("SELECT position FROM kanban_columns WHERE id = $1", UUID(col_id_b))
        await conn.execute("UPDATE kanban_columns SET position=$1, updated_by=$2 WHERE id=$3", pos_b, UUID(user_id), UUID(col_id_a))
        await conn.execute("UPDATE kanban_columns SET position=$1, updated_by=$2 WHERE id=$3", pos_a, UUID(user_id), UUID(col_id_b))


async def fetch_persons_for_feature(pool, feature_instance_id: str) -> list[dict]:
    async with pool.acquire() as conn:
        rows = await conn.fetch(
            """SELECT DISTINCT p.id, p.first_name || ' ' || p.last_name AS name
               FROM projects_features pf
               JOIN tribes_projects tp ON tp.project_id = pf.project_id
               JOIN positions pos ON pos.tribe_id = tp.tribe_id AND pos.status = 'active'
               JOIN persons p ON p.id = pos.person_id AND p.status = 'active'
               WHERE pf.id = $1
               ORDER BY name ASC""",
            UUID(feature_instance_id),
        )
    return [dict(r) for r in rows]


async def fetch_card(pool, card_id: str) -> Optional[dict]:
    async with pool.acquire() as conn:
        row = await conn.fetchrow(
            """SELECT kc.*, d.content_html AS document_content_html,
                      p.first_name || ' ' || p.last_name AS assigned_person_name
               FROM kanban_cards kc
               LEFT JOIN documents d ON d.id = kc.document_id
               LEFT JOIN persons p ON p.id = kc.assigned_person_id
               WHERE kc.id = $1""",
            UUID(card_id),
        )
    return dict(row) if row else None


async def insert_card(
    pool, feature_instance_id: str, column_id: str,
    title: str, assigned_person_id: Optional[str], position: int, user_id: str,
) -> dict:
    async with pool.acquire() as conn:
        row = await conn.fetchrow(
            """INSERT INTO kanban_cards
               (feature_instance_id, column_id, title, assigned_person_id, position, created_by, updated_by)
               VALUES ($1, $2, $3, $4, $5, $6, $6) RETURNING id""",
            UUID(feature_instance_id), UUID(column_id),
            title,
            UUID(assigned_person_id) if assigned_person_id else None,
            position, UUID(user_id),
        )
    return await fetch_card(pool, str(row["id"]))


async def update_card_fields(
    pool, card_id: str, title: Optional[str], assigned_person_id: Optional[str],
    clear_assignee: bool, user_id: str,
) -> None:
    async with pool.acquire() as conn:
        if title is not None:
            await conn.execute("UPDATE kanban_cards SET title = $1, updated_by = $2 WHERE id = $3", title, UUID(user_id), UUID(card_id))
        if clear_assignee:
            await conn.execute("UPDATE kanban_cards SET assigned_person_id = NULL, updated_by = $1 WHERE id = $2", UUID(user_id), UUID(card_id))
        elif assigned_person_id is not None:
            await conn.execute("UPDATE kanban_cards SET assigned_person_id = $1, updated_by = $2 WHERE id = $3", UUID(assigned_person_id), UUID(user_id), UUID(card_id))


async def set_card_document(pool, card_id: str, document_id: str, user_id: str) -> None:
    async with pool.acquire() as conn:
        await conn.execute(
            "UPDATE kanban_cards SET document_id = $1, updated_by = $2 WHERE id = $3",
            UUID(document_id), UUID(user_id), UUID(card_id),
        )


async def archive_card(pool, card_id: str, user_id: str) -> None:
    async with pool.acquire() as conn:
        await conn.execute(
            "UPDATE kanban_cards SET status = 'archived', updated_by = $1 WHERE id = $2 OR parent_card_id = $2",
            UUID(user_id), UUID(card_id),
        )


async def move_card_to_column(pool, card_id: str, column_id: str, user_id: str) -> None:
    async with pool.acquire() as conn:
        await conn.execute(
            "UPDATE kanban_cards SET column_id = $1, updated_by = $2 WHERE id = $3",
            UUID(column_id), UUID(user_id), UUID(card_id),
        )


