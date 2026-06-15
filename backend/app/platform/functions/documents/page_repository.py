import json
from datetime import datetime, timezone
from typing import List, Optional
from uuid import UUID

from app.platform.core.utils.db_helpers import generate_url_param_id, row_to_dict
from app.platform.core.utils.document_helpers import extract_content_summary, strip_html


async def create_page(
    pool,
    project_document_id: str,
    title: str,
    content_html: str,
    attachments: list,
    order_index: int,
    user_id: str,
) -> dict:
    now = datetime.now(timezone.utc)
    uid = UUID(user_id)
    url_param_id = generate_url_param_id()
    async with pool.acquire() as conn:
        row = await conn.fetchrow(
            """INSERT INTO document_pages
                   (url_param_id, project_document_id, title, content_html,
                    content_summary, content_text, attachments, order_index,
                    status, created_at, updated_at, created_by, updated_by)
               VALUES ($1, $2, $3, $4, $5, $6, $7::jsonb, $8, 'active', $9, $9, $10, $10)                              
               RETURNING *""",
            url_param_id,
            UUID(project_document_id),
            title,
            content_html,
            extract_content_summary(content_html),
            strip_html(content_html),
            json.dumps([a.model_dump() if hasattr(a, "model_dump") else a for a in attachments]),
            order_index,
            now,
            uid,
        )
    return row_to_dict(row)


async def get_page(pool, page_id: str) -> Optional[dict]:
    async with pool.acquire() as conn:
        row = await conn.fetchrow(
            "SELECT * FROM document_pages WHERE id = $1",
            UUID(page_id),
        )
    return row_to_dict(row) if row else None


async def list_pages(pool, project_document_id: str) -> List[dict]:
    async with pool.acquire() as conn:
        rows = await conn.fetch(
            """SELECT * FROM document_pages
               WHERE project_document_id = $1 AND status = 'active'
               ORDER BY order_index ASC, created_at ASC""",
            UUID(project_document_id),
        )
    return [row_to_dict(r) for r in rows]


async def update_page(
    pool,
    page_id: str,
    title: Optional[str],
    content_html: Optional[str],
    attachments: Optional[list],
    order_index: Optional[int],
    user_id: str,
) -> Optional[dict]:
    now = datetime.now(timezone.utc)
    uid = UUID(user_id)
    page = await get_page(pool, page_id)
    if not page:
        return None

    if title is not None:
        async with pool.acquire() as conn:
            await conn.execute(
                "UPDATE document_pages SET title = $1, updated_at = $2, updated_by = $3 WHERE id = $4",
                title,
                now,
                uid,
                UUID(page_id),
            )

    if content_html is not None:
        # Snapshot current content as a revision
        revisions_raw = page.get("revisions") or "[]"
        current_revisions = (
            json.loads(revisions_raw) if isinstance(revisions_raw, str) else (revisions_raw or [])
        )
        current_revisions.append(
            {
                "content_html": page.get("content_html", ""),
                "updated_at": (
                    page["updated_at"].isoformat()
                    if hasattr(page.get("updated_at"), "isoformat")
                    else str(page.get("updated_at"))
                ),
                "updated_by": page.get("updated_by"),
            }
        )
        async with pool.acquire() as conn:
            await conn.execute(
                """UPDATE document_pages
                   SET content_html = $1, content_summary = $2, content_text = $3,
                       revisions = $4::jsonb, updated_at = $5, updated_by = $6
                   WHERE id = $7""",
                content_html,
                extract_content_summary(content_html),
                strip_html(content_html),
                json.dumps(current_revisions),
                now,
                uid,
                UUID(page_id),
            )

    if attachments is not None:
        async with pool.acquire() as conn:
            await conn.execute(
                "UPDATE document_pages SET attachments = $1::jsonb, updated_at = $2, updated_by = $3 WHERE id = $4",
                json.dumps([a.model_dump() if hasattr(a, "model_dump") else a for a in attachments]),
                now,
                uid,
                UUID(page_id),
            )

    if order_index is not None:
        async with pool.acquire() as conn:
            await conn.execute(
                "UPDATE document_pages SET order_index = $1, updated_at = $2, updated_by = $3 WHERE id = $4",
                order_index,
                now,
                uid,
                UUID(page_id),
            )

    return await get_page(pool, page_id)


async def reorder_pages(pool, project_document_id: str, page_orders: list, user_id: str) -> None:
    now = datetime.now(timezone.utc)
    uid = UUID(user_id)
    async with pool.acquire() as conn:
        async with conn.transaction():
            for item in page_orders:
                await conn.execute(
                    """UPDATE document_pages
                       SET order_index = $1, updated_at = $2, updated_by = $3
                       WHERE id = $4 AND project_document_id = $5""",
                    item["order_index"],
                    now,
                    uid,
                    UUID(item["page_id"]),
                    UUID(project_document_id),
                )


async def archive_page(pool, page_id: str, user_id: str) -> bool:
    now = datetime.now(timezone.utc)
    uid = UUID(user_id)
    async with pool.acquire() as conn:
        result = await conn.execute(
            "UPDATE document_pages SET status = 'archived', updated_at = $1, updated_by = $2 WHERE id = $3",
            now,
            uid,
            UUID(page_id),
        )
    return result != "UPDATE 0"
