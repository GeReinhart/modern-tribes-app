from typing import Optional
from uuid import UUID
from datetime import datetime, timezone

from app.repositories.persons_repository import fetch_persons_for_feature  # noqa: F401


async def fetch_todo_items(pool, feature_instance_id: str) -> list[dict]:
    async with pool.acquire() as conn:
        rows = await conn.fetch(
            """SELECT t.*, d.content_html AS document_content_html,
                      p.first_name || ' ' || p.last_name AS assigned_person_name,
                      ARRAY(
                          SELECT til.label_id::text
                          FROM todo_item_labels til
                          WHERE til.item_id = t.id
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
                          SELECT til.label_id::text
                          FROM todo_item_labels til
                          WHERE til.item_id = t.id
                      ) AS label_ids
               FROM todo_items t
               LEFT JOIN documents d ON d.id = t.document_id
               LEFT JOIN persons p ON p.id = t.assigned_person_id
               WHERE t.id = $1""",
            UUID(item_id),
        )
    return dict(row) if row else None


async def insert_todo_item(pool, feature_instance_id: str, title: str, position: int, user_id: str) -> dict:
    async with pool.acquire() as conn:
        row = await conn.fetchrow(
            """INSERT INTO todo_items (feature_instance_id, title, position, created_by, updated_by)
               VALUES ($1, $2, $3, $4, $4) RETURNING *""",
            UUID(feature_instance_id), title, position, UUID(user_id),
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
            UUID(item_id), *fields.values(),
        )


async def update_todo_fields(pool, item_id: str, size: Optional[int], clear_size: bool,
                             assigned_person_id: Optional[str], clear_assignee: bool, user_id: str) -> None:
    uid = UUID(user_id)
    iid = UUID(item_id)
    async with pool.acquire() as conn:
        if clear_size:
            await conn.execute("UPDATE todo_items SET size = NULL, updated_by = $1 WHERE id = $2", uid, iid)
        elif size is not None:
            await conn.execute("UPDATE todo_items SET size = $1, updated_by = $2 WHERE id = $3", size, uid, iid)
        if clear_assignee:
            await conn.execute("UPDATE todo_items SET assigned_person_id = NULL, updated_by = $1 WHERE id = $2", uid, iid)
        elif assigned_person_id is not None:
            await conn.execute("UPDATE todo_items SET assigned_person_id = $1, updated_by = $2 WHERE id = $3",
                               UUID(assigned_person_id), uid, iid)


async def upsert_document(pool, item_id: str, content_html: str, content_text: str,
                          content_summary: str, user_id: str) -> None:
    uid = UUID(user_id)
    iid = UUID(item_id)
    now = datetime.now(timezone.utc)
    async with pool.acquire() as conn:
        doc_id = await conn.fetchval("SELECT document_id FROM todo_items WHERE id = $1", iid)
        if doc_id is None:
            new_doc_id = await conn.fetchval(
                """INSERT INTO documents (content_html, content_text, content_summary, created_by, updated_by)
                   VALUES ($1, $2, $3, $4, $4) RETURNING id""",
                content_html, content_text, content_summary, uid,
            )
            await conn.execute("UPDATE todo_items SET document_id = $1 WHERE id = $2", new_doc_id, iid)
        else:
            await conn.execute(
                """UPDATE documents SET content_html=$1, content_text=$2, content_summary=$3,
                   updated_at=$4, updated_by=$5 WHERE id=$6""",
                content_html, content_text, content_summary, now, uid, doc_id,
            )


async def fetch_labels(pool, feature_instance_id: str) -> list[dict]:
    async with pool.acquire() as conn:
        rows = await conn.fetch(
            "SELECT id, name, color, position FROM todo_labels WHERE feature_instance_id = $1 ORDER BY position ASC",
            UUID(feature_instance_id),
        )
    return [{"id": str(r["id"]), "name": r["name"], "color": r["color"], "position": r["position"]} for r in rows]


async def insert_label(pool, feature_instance_id: str, name: str, color: str, user_id: str) -> dict:
    async with pool.acquire() as conn:
        position = await conn.fetchval(
            "SELECT COALESCE(MAX(position), -1) + 1 FROM todo_labels WHERE feature_instance_id = $1",
            UUID(feature_instance_id),
        )
        row = await conn.fetchrow(
            """INSERT INTO todo_labels (feature_instance_id, name, color, position, created_by, updated_by)
               VALUES ($1, $2, $3, $4, $5, $5) RETURNING id, name, color, position""",
            UUID(feature_instance_id), name, color, position, UUID(user_id),
        )
    return {"id": str(row["id"]), "name": row["name"], "color": row["color"], "position": row["position"]}


async def update_label(pool, label_id: str, name: Optional[str], user_id: str) -> None:
    if name is not None:
        async with pool.acquire() as conn:
            await conn.execute(
                "UPDATE todo_labels SET name = $1, updated_by = $2 WHERE id = $3",
                name, UUID(user_id), UUID(label_id),
            )


async def delete_label(pool, label_id: str) -> None:
    async with pool.acquire() as conn:
        await conn.execute("DELETE FROM todo_labels WHERE id = $1", UUID(label_id))


async def toggle_item_label(pool, item_id: str, label_id: str) -> list[str]:
    iid, lid = UUID(item_id), UUID(label_id)
    async with pool.acquire() as conn:
        existing = await conn.fetchval(
            "SELECT 1 FROM todo_item_labels WHERE item_id = $1 AND label_id = $2", iid, lid,
        )
        if existing:
            await conn.execute("DELETE FROM todo_item_labels WHERE item_id = $1 AND label_id = $2", iid, lid)
        else:
            await conn.execute(
                "INSERT INTO todo_item_labels (item_id, label_id) VALUES ($1, $2) ON CONFLICT DO NOTHING", iid, lid,
            )
        rows = await conn.fetch("SELECT label_id::text FROM todo_item_labels WHERE item_id = $1", iid)
    return [r["label_id"] for r in rows]
