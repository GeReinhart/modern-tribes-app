from datetime import date, datetime, timezone
from typing import Optional
from uuid import UUID

from app.platform.core.utils.document_helpers import strip_html, extract_content_summary


async def fetch_blocks_for_day(pool, feature_instance_id: str, day: date) -> list[dict]:
    async with pool.acquire() as conn:
        rows = await conn.fetch(
            """SELECT jb.*,
                      d.content_html,
                      d.content_summary,
                      ARRAY(
                          SELECT le.label_id::text
                          FROM label_entities le
                          WHERE le.entity_type = 'journal_block' AND le.entity_id = jb.id
                      ) AS label_ids
               FROM journal_blocks jb
               LEFT JOIN documents d ON d.id = jb.document_id
               WHERE jb.feature_instance_id = $1 AND jb.date = $2 AND jb.status = 'active'
               ORDER BY jb.position ASC""",
            UUID(feature_instance_id), day,
        )
    return [dict(r) for r in rows]


async def fetch_block(pool, block_id: str) -> Optional[dict]:
    async with pool.acquire() as conn:
        row = await conn.fetchrow(
            """SELECT jb.*,
                      d.content_html,
                      d.content_summary,
                      ARRAY(
                          SELECT le.label_id::text
                          FROM label_entities le
                          WHERE le.entity_type = 'journal_block' AND le.entity_id = jb.id
                      ) AS label_ids
               FROM journal_blocks jb
               LEFT JOIN documents d ON d.id = jb.document_id
               WHERE jb.id = $1""",
            UUID(block_id),
        )
    return dict(row) if row else None


async def fetch_days_with_blocks(pool, feature_instance_id: str) -> list[date]:
    async with pool.acquire() as conn:
        rows = await conn.fetch(
            """SELECT DISTINCT date FROM journal_blocks
               WHERE feature_instance_id = $1 AND status = 'active'
               ORDER BY date DESC""",
            UUID(feature_instance_id),
        )
    return [r["date"] for r in rows]


async def fetch_blocks_by_label(pool, feature_instance_id: str, label_id: str) -> list[dict]:
    async with pool.acquire() as conn:
        rows = await conn.fetch(
            """SELECT jb.*,
                      d.content_html,
                      d.content_summary,
                      ARRAY(
                          SELECT le2.label_id::text
                          FROM label_entities le2
                          WHERE le2.entity_type = 'journal_block' AND le2.entity_id = jb.id
                      ) AS label_ids
               FROM journal_blocks jb
               JOIN label_entities le ON le.entity_id = jb.id
                   AND le.entity_type = 'journal_block' AND le.label_id = $2
               LEFT JOIN documents d ON d.id = jb.document_id
               WHERE jb.feature_instance_id = $1 AND jb.status = 'active'
               ORDER BY jb.date DESC, jb.position ASC""",
            UUID(feature_instance_id), UUID(label_id),
        )
    return [dict(r) for r in rows]


async def insert_block(
    pool, feature_instance_id: str, day: date, position: int,
    content_html: str, user_id: str
) -> dict:
    uid = UUID(user_id)
    fid = UUID(feature_instance_id)
    content_text = strip_html(content_html)
    content_summary = extract_content_summary(content_html)
    async with pool.acquire() as conn:
        doc_id = await conn.fetchval(
            """INSERT INTO documents (content_html, content_text, content_summary, created_by, updated_by)
               VALUES ($1, $2, $3, $4, $4) RETURNING id""",
            content_html, content_text, content_summary, uid,
        )
        await conn.execute(
            """UPDATE journal_blocks
               SET position = position + 1, updated_by = $1
               WHERE feature_instance_id = $2 AND date = $3
                 AND status = 'active' AND position >= $4""",
            uid, fid, day, position,
        )
        row = await conn.fetchrow(
            """INSERT INTO journal_blocks
                   (feature_instance_id, date, document_id, position, created_by, updated_by)
               VALUES ($1, $2, $3, $4, $5, $5) RETURNING *""",
            fid, day, doc_id, position, uid,
        )
    return dict(row) | {"document_id": str(doc_id), "content_html": content_html,
                        "content_summary": content_summary, "label_ids": []}


async def update_block_content(pool, block_id: str, content_html: str, user_id: str) -> None:
    uid = UUID(user_id)
    bid = UUID(block_id)
    content_text = strip_html(content_html)
    content_summary = extract_content_summary(content_html)
    now = datetime.now(timezone.utc)
    async with pool.acquire() as conn:
        doc_id = await conn.fetchval("SELECT document_id FROM journal_blocks WHERE id = $1", bid)
        if doc_id:
            await conn.execute(
                """UPDATE documents SET content_html=$1, content_text=$2, content_summary=$3,
                   updated_at=$4, updated_by=$5 WHERE id=$6""",
                content_html, content_text, content_summary, now, uid, doc_id,
            )
        await conn.execute(
            "UPDATE journal_blocks SET updated_at=$1, updated_by=$2 WHERE id=$3",
            now, uid, bid,
        )


async def archive_block(pool, block_id: str, user_id: str) -> None:
    uid = UUID(user_id)
    now = datetime.now(timezone.utc)
    async with pool.acquire() as conn:
        await conn.execute(
            "UPDATE journal_blocks SET status='archived', updated_at=$1, updated_by=$2 WHERE id=$3",
            now, uid, UUID(block_id),
        )


async def reorder_blocks(
    pool, feature_instance_id: str, day: date, ordered_ids: list[str], user_id: str
) -> None:
    uid = UUID(user_id)
    fid = UUID(feature_instance_id)
    now = datetime.now(timezone.utc)
    async with pool.acquire() as conn:
        for position, block_id in enumerate(ordered_ids):
            await conn.execute(
                """UPDATE journal_blocks SET position=$1, updated_at=$2, updated_by=$3
                   WHERE id=$4 AND feature_instance_id=$5 AND date=$6""",
                position, now, uid, UUID(block_id), fid, day,
            )


