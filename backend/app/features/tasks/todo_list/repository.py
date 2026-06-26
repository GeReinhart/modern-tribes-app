from datetime import date, datetime, timezone
from typing import Optional
from uuid import UUID


async def fetch_todo_items(pool, feature_instance_id: str) -> list[dict]:
    async with pool.acquire() as conn:
        rows = await conn.fetch(
            """SELECT t.*, d.content_html AS document_content_html,
                      p.first_name || ' ' || p.last_name AS assigned_person_name,
                      ARRAY(
                          SELECT le.label_id::text
                          FROM label_entities le
                          WHERE le.entity_type = 'todo_item' AND le.entity_id = t.id
                      ) AS label_ids
               FROM todo_items t
               LEFT JOIN documents d ON d.id = t.document_id
               LEFT JOIN persons p ON p.id = t.assigned_person_id
               WHERE t.feature_instance_id = $1
               ORDER BY t.position ASC, t.created_at ASC""",
            UUID(feature_instance_id),
        )
    return [dict(r) for r in rows]


async def fetch_todo_item(pool, item_id: str) -> Optional[dict]:
    async with pool.acquire() as conn:
        row = await conn.fetchrow(
            """SELECT t.*, d.content_html AS document_content_html,
                      p.first_name || ' ' || p.last_name AS assigned_person_name,
                      ARRAY(
                          SELECT le.label_id::text
                          FROM label_entities le
                          WHERE le.entity_type = 'todo_item' AND le.entity_id = t.id
                      ) AS label_ids
               FROM todo_items t
               LEFT JOIN documents d ON d.id = t.document_id
               LEFT JOIN persons p ON p.id = t.assigned_person_id
               WHERE t.id = $1""",
            UUID(item_id),
        )
    return dict(row) if row else None


async def insert_todo_item(pool, feature_instance_id: str, title: str, position: int, user_id: str, force_on_dashboard: bool = False) -> dict:
    async with pool.acquire() as conn:
        row = await conn.fetchrow(
            """INSERT INTO todo_items (feature_instance_id, title, position, force_on_dashboard, created_by, updated_by)
               VALUES ($1, $2, $3, $4, $5, $5) RETURNING *""",
            UUID(feature_instance_id),
            title,
            position,
            force_on_dashboard,
            UUID(user_id),
        )
    return dict(row)


async def update_todo_item_basic(pool, item_id: str, updates: dict, user_id: str) -> None:
    if not updates:
        return
    now = datetime.now(timezone.utc)
    fields = {"updated_by": UUID(user_id), "updated_at": now, **updates}
    set_clauses = ", ".join(f"{k} = ${i + 2}" for i, k in enumerate(fields.keys()))
    async with pool.acquire() as conn:
        await conn.execute(
            f"UPDATE todo_items SET {set_clauses} WHERE id = $1",
            UUID(item_id),
            *fields.values(),
        )


async def update_todo_fields(
    pool,
    item_id: str,
    size: Optional[int],
    clear_size: bool,
    assigned_person_id: Optional[str],
    clear_assignee: bool,
    due_date: Optional[date],
    clear_due_date: bool,
    force_on_dashboard: Optional[bool],
    user_id: str,
) -> None:
    uid = UUID(user_id)
    iid = UUID(item_id)
    async with pool.acquire() as conn:
        if clear_size:
            await conn.execute("UPDATE todo_items SET size = NULL, updated_by = $1 WHERE id = $2", uid, iid)
        elif size is not None:
            await conn.execute(
                "UPDATE todo_items SET size = $1, updated_by = $2 WHERE id = $3", size, uid, iid
            )
        if clear_assignee:
            await conn.execute(
                "UPDATE todo_items SET assigned_person_id = NULL, updated_by = $1 WHERE id = $2", uid, iid
            )
        elif assigned_person_id is not None:
            await conn.execute(
                "UPDATE todo_items SET assigned_person_id = $1, updated_by = $2 WHERE id = $3",
                UUID(assigned_person_id),
                uid,
                iid,
            )
        if clear_due_date:
            await conn.execute(
                "UPDATE todo_items SET due_date = NULL, updated_by = $1 WHERE id = $2", uid, iid
            )
        elif due_date is not None:
            await conn.execute(
                "UPDATE todo_items SET due_date = $1, updated_by = $2 WHERE id = $3", due_date, uid, iid
            )
        if force_on_dashboard is not None:
            await conn.execute(
                "UPDATE todo_items SET force_on_dashboard = $1, updated_by = $2 WHERE id = $3", force_on_dashboard, uid, iid
            )


async def upsert_document(
    pool, item_id: str, content_html: str, content_text: str, content_summary: str, user_id: str
) -> None:
    uid = UUID(user_id)
    iid = UUID(item_id)
    now = datetime.now(timezone.utc)
    async with pool.acquire() as conn:
        doc_id = await conn.fetchval("SELECT document_id FROM todo_items WHERE id = $1", iid)
        if doc_id is None:
            new_doc_id = await conn.fetchval(
                """INSERT INTO documents (content_html, content_text, content_summary, created_by, updated_by)
                   VALUES ($1, $2, $3, $4, $4) RETURNING id""",
                content_html,
                content_text,
                content_summary,
                uid,
            )
            await conn.execute("UPDATE todo_items SET document_id = $1 WHERE id = $2", new_doc_id, iid)
        else:
            await conn.execute(
                """UPDATE documents SET content_html=$1, content_text=$2, content_summary=$3,
                   updated_at=$4, updated_by=$5 WHERE id=$6""",
                content_html,
                content_text,
                content_summary,
                now,
                uid,
                doc_id,
            )
