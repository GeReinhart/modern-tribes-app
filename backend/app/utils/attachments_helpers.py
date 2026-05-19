from datetime import datetime, timezone
from typing import List
from uuid import UUID

from ..models.uploads.files import AttachmentFile
from ..utils.db_helpers import row_to_dict
from ..utils.document_helpers import extract_content_summary, strip_html


async def get_document_with_attachments(pool, document_id: str) -> dict:
    """Get document with its attachments from separate table"""
    # Get document
    async with pool.acquire() as conn:
        document_row = await conn.fetchrow(
            "SELECT * FROM documents WHERE id = $1",
            UUID(document_id)
        )

    if not document_row:
        return None

    document = row_to_dict(document_row)

    # Get attachments
    async with pool.acquire() as conn:
        attachment_rows = await conn.fetch(
            "SELECT * FROM document_attachments WHERE document_id = $1 ORDER BY uploaded_at DESC",
            UUID(document_id)
        )

    attachments = [row_to_dict(row) for row in attachment_rows] if attachment_rows else []
    document["attachments"] = attachments

    return document


async def create_document_with_attachments(pool, content_html: str, attachments: List[AttachmentFile] = None, user_id: str = None) -> dict:
    """Create document and its attachments"""
    now = datetime.now(timezone.utc)
    uid = UUID(user_id) if user_id else None
    async with pool.acquire() as conn:
        document_row = await conn.fetchrow(
            """INSERT INTO documents (content_html, content_summary, content_text, created_at, updated_at, created_by, updated_by)
               VALUES ($1, $2, $3, $4, $4, $5, $5)
                   RETURNING *""",
            content_html,
            extract_content_summary(content_html),
            strip_html(content_html),
            now,
            uid,
        )

    document = row_to_dict(document_row)
    document_id = document["id"]

    # Create attachments if provided
    if attachments:
        async with pool.acquire() as conn:
            for attachment in attachments:
                attachment_dict = attachment.model_dump() if hasattr(attachment, 'model_dump') else attachment
                await conn.execute(
                    """INSERT INTO document_attachments
                           (document_id, file_id, name, size, type, url, uploaded_at, created_at)
                       VALUES ($1, $2, $3, $4, $5, $6, $7, $8)""",
                    UUID(document_id),
                    attachment_dict.get("id"),
                    attachment_dict.get("name"),
                    attachment_dict.get("size"),
                    attachment_dict.get("type"),
                    attachment_dict.get("url"),
                    attachment_dict.get("uploaded_at", datetime.now(timezone.utc)),
                    datetime.now(timezone.utc)
                )

    document["attachments"] = attachments if attachments else []
    return document


async def update_document_attachments(pool, document_id: str, attachments: List[AttachmentFile], user_id: str = None) -> None:
    """Update document attachments (delete old, create new)"""
    uid = UUID(user_id) if user_id else None
    async with pool.acquire() as conn:
        await conn.execute(
            "UPDATE documents SET updated_at = $1, updated_by = $2 WHERE id = $3",
            datetime.now(timezone.utc), uid, UUID(document_id)
        )
    async with pool.acquire() as conn:
        # Delete existing attachments
        await conn.execute(
            "DELETE FROM document_attachments WHERE document_id = $1",
            UUID(document_id)
        )

        # Create new attachments
        if attachments:
            for attachment in attachments:
                attachment_dict = attachment.model_dump() if hasattr(attachment, 'model_dump') else attachment
                await conn.execute(
                    """INSERT INTO document_attachments
                           (document_id, file_id, name, size, type, url, uploaded_at, created_at)
                       VALUES ($1, $2, $3, $4, $5, $6, $7, $8)""",
                    UUID(document_id),
                    attachment_dict.get("id"),
                    attachment_dict.get("name"),
                    attachment_dict.get("size"),
                    attachment_dict.get("type"),
                    attachment_dict.get("url"),
                    attachment_dict.get("uploaded_at", datetime.now(timezone.utc)),
                    datetime.now(timezone.utc)
                )
