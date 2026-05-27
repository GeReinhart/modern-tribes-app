from datetime import datetime, timezone
from uuid import UUID


async def index_tribe_document(pool, tribe_id: str, document_id: str, user_id: str) -> None:
    now = datetime.now(timezone.utc)
    async with pool.acquire() as conn:
        row = await conn.fetchrow(
            "SELECT content_text, content_summary FROM documents WHERE id = $1 AND status = 'active'",
            UUID(document_id),
        )
    if not row or not row["content_text"]:
        return
    await _upsert(
        pool,
        entity_type="document",
        entity_id=document_id,
        content_text=row["content_text"],
        content_summary=row["content_summary"],
        tribe_id=tribe_id,
        project_id=None,
        project_document_id=None,
        page_url_param_id=None,
        user_id=user_id,
        now=now,
    )


async def index_project_document(pool, project_id: str, document_id: str, user_id: str) -> None:
    now = datetime.now(timezone.utc)
    async with pool.acquire() as conn:
        doc_row = await conn.fetchrow(
            "SELECT content_text, content_summary FROM documents WHERE id = $1 AND status = 'active'",
            UUID(document_id),
        )
        tribe_row = await conn.fetchrow(
            """SELECT t.id AS tribe_id FROM tribes t
               JOIN tribes_projects tp ON tp.tribe_id = t.id
               WHERE tp.project_id = $1 AND t.status = 'active'
               LIMIT 1""",
            UUID(project_id),
        )
    if not doc_row or not doc_row["content_text"] or not tribe_row:
        return
    await _upsert(
        pool,
        entity_type="document",
        entity_id=document_id,
        content_text=doc_row["content_text"],
        content_summary=doc_row["content_summary"],
        tribe_id=str(tribe_row["tribe_id"]),
        project_id=project_id,
        project_document_id=None,
        page_url_param_id=None,
        user_id=user_id,
        now=now,
    )


async def index_projects_document(pool, project_document_uuid: str, user_id: str) -> None:
    now = datetime.now(timezone.utc)
    async with pool.acquire() as conn:
        pd_row = await conn.fetchrow(
            """SELECT pd.url_param_id, pd.project_id, pd.document_id
               FROM projects_documents pd
               WHERE pd.id = $1 AND pd.status = 'active'""",
            UUID(project_document_uuid),
        )
    if not pd_row:
        return
    async with pool.acquire() as conn:
        doc_row = await conn.fetchrow(
            "SELECT content_text, content_summary FROM documents WHERE id = $1 AND status = 'active'",
            pd_row["document_id"],
        )
        tribe_row = await conn.fetchrow(
            """SELECT t.id AS tribe_id FROM tribes t
               JOIN tribes_projects tp ON tp.tribe_id = t.id
               WHERE tp.project_id = $1 AND t.status = 'active'
               LIMIT 1""",
            pd_row["project_id"],
        )
    if not doc_row or not doc_row["content_text"] or not tribe_row:
        return
    await _upsert(
        pool,
        entity_type="document",
        entity_id=str(pd_row["document_id"]),
        content_text=doc_row["content_text"],
        content_summary=doc_row["content_summary"],
        tribe_id=str(tribe_row["tribe_id"]),
        project_id=str(pd_row["project_id"]),
        project_document_id=pd_row["url_param_id"],
        page_url_param_id=None,
        user_id=user_id,
        now=now,
    )


async def index_page(pool, page_id: str, user_id: str) -> None:
    now = datetime.now(timezone.utc)
    async with pool.acquire() as conn:
        page_row = await conn.fetchrow(
            """SELECT dp.content_text, dp.content_summary, dp.url_param_id,
                      pd.url_param_id AS pd_url_param_id, pd.project_id
               FROM document_pages dp
               JOIN projects_documents pd ON pd.id = dp.project_document_id AND pd.status = 'active'
               WHERE dp.id = $1 AND dp.status = 'active'""",
            UUID(page_id),
        )
    if not page_row or not page_row["content_text"]:
        return
    async with pool.acquire() as conn:
        tribe_row = await conn.fetchrow(
            """SELECT t.id AS tribe_id FROM tribes t
               JOIN tribes_projects tp ON tp.tribe_id = t.id
               WHERE tp.project_id = $1 AND t.status = 'active'
               LIMIT 1""",
            page_row["project_id"],
        )
    if not tribe_row:
        return
    await _upsert(
        pool,
        entity_type="page",
        entity_id=page_id,
        content_text=page_row["content_text"],
        content_summary=page_row["content_summary"],
        tribe_id=str(tribe_row["tribe_id"]),
        project_id=str(page_row["project_id"]),
        project_document_id=page_row["pd_url_param_id"],
        page_url_param_id=page_row["url_param_id"],
        user_id=user_id,
        now=now,
    )


async def archive_entity(pool, entity_type: str, entity_id: str, user_id: str) -> None:
    now = datetime.now(timezone.utc)
    async with pool.acquire() as conn:
        await conn.execute(
            """UPDATE search_index
               SET status = 'archived', updated_at = $1, updated_by = $2
               WHERE entity_type = $3 AND entity_id = $4""",
            now,
            UUID(user_id),
            entity_type,
            UUID(entity_id),
        )


async def _upsert(
    pool,
    entity_type: str,
    entity_id: str,
    content_text: str,
    content_summary,
    tribe_id: str,
    project_id,
    project_document_id,
    page_url_param_id,
    user_id: str,
    now: datetime,
) -> None:
    async with pool.acquire() as conn:
        await conn.execute(
            """INSERT INTO search_index
                   (entity_type, entity_id, content_text, content_summary,
                    tribe_id, project_id, project_document_id, page_url_param_id,
                    status, created_at, updated_at, created_by, updated_by)
               VALUES ($1, $2, $3, $4, $5, $6, $7, $8, 'active', $9, $9, $10, $10)
               ON CONFLICT (entity_type, entity_id) DO UPDATE SET
                   content_text = EXCLUDED.content_text,
                   content_summary = EXCLUDED.content_summary,
                   tribe_id = EXCLUDED.tribe_id,
                   project_id = EXCLUDED.project_id,
                   project_document_id = EXCLUDED.project_document_id,
                   page_url_param_id = EXCLUDED.page_url_param_id,
                   status = 'active',
                   updated_at = EXCLUDED.updated_at,
                   updated_by = EXCLUDED.updated_by""",
            entity_type,
            UUID(entity_id),
            content_text,
            content_summary,
            UUID(tribe_id),
            UUID(project_id) if project_id else None,
            project_document_id,
            page_url_param_id,
            now,
            UUID(user_id),
        )
