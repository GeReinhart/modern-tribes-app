from datetime import datetime, timezone
from uuid import UUID


async def index_tribe_document(pool, tribe_id: str, document_id: str, user_id: str) -> None:
    now = datetime.now(timezone.utc)
    async with pool.acquire() as conn:
        doc_row = await conn.fetchrow(
            "SELECT content_text, content_summary FROM documents WHERE id = $1 AND status = 'active'",
            UUID(document_id),
        )
        tribe_row = await conn.fetchrow(
            "SELECT url_param_id FROM tribes WHERE id = $1 AND status = 'active'",
            UUID(tribe_id),
        )
    if not doc_row or not doc_row["content_text"] or not tribe_row:
        return
    routing_path = f"/app/tribes/{tribe_row['url_param_id']}"
    await _upsert(pool, "document", document_id, doc_row["content_text"],
                  doc_row["content_summary"], routing_path, user_id, now)


async def index_project_document(pool, project_id: str, document_id: str, user_id: str) -> None:
    now = datetime.now(timezone.utc)
    async with pool.acquire() as conn:
        doc_row = await conn.fetchrow(
            "SELECT content_text, content_summary FROM documents WHERE id = $1 AND status = 'active'",
            UUID(document_id),
        )
        path_row = await conn.fetchrow(
            """SELECT t.url_param_id AS tribe_url_param_id, p.url_param_id AS project_url_param_id
               FROM projects p
               JOIN tribes_projects tp ON tp.project_id = p.id
               JOIN tribes t ON t.id = tp.tribe_id AND t.status = 'active'
               WHERE p.id = $1 AND p.status = 'active'
               LIMIT 1""",
            UUID(project_id),
        )
    if not doc_row or not doc_row["content_text"] or not path_row:
        return
    routing_path = (
        f"/app/tribes/{path_row['tribe_url_param_id']}"
        f"/projects/{path_row['project_url_param_id']}"
    )
    await _upsert(pool, "document", document_id, doc_row["content_text"],
                  doc_row["content_summary"], routing_path, user_id, now)


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
        path_row = await conn.fetchrow(
            """SELECT t.url_param_id AS tribe_url_param_id, p.url_param_id AS project_url_param_id
               FROM projects p
               JOIN tribes_projects tp ON tp.project_id = p.id
               JOIN tribes t ON t.id = tp.tribe_id AND t.status = 'active'
               WHERE p.id = $1 AND p.status = 'active'
               LIMIT 1""",
            pd_row["project_id"],
        )
    if not doc_row or not doc_row["content_text"] or not path_row:
        return
    routing_path = (
        f"/app/tribes/{path_row['tribe_url_param_id']}"
        f"/projects/{path_row['project_url_param_id']}"
        f"/documents/{pd_row['url_param_id']}"
    )
    await _upsert(pool, "document", str(pd_row["document_id"]), doc_row["content_text"],
                  doc_row["content_summary"], routing_path, user_id, now)


async def index_page(pool, page_id: str, user_id: str) -> None:
    now = datetime.now(timezone.utc)
    async with pool.acquire() as conn:
        page_row = await conn.fetchrow(
            """SELECT dp.content_text, dp.content_summary,
                      pd.url_param_id AS pd_url_param_id, pd.project_id
               FROM document_pages dp
               JOIN projects_documents pd ON pd.id = dp.project_document_id AND pd.status = 'active'
               WHERE dp.id = $1 AND dp.status = 'active'""",
            UUID(page_id),
        )
    if not page_row or not page_row["content_text"]:
        return
    async with pool.acquire() as conn:
        path_row = await conn.fetchrow(
            """SELECT t.url_param_id AS tribe_url_param_id, p.url_param_id AS project_url_param_id
               FROM projects p
               JOIN tribes_projects tp ON tp.project_id = p.id
               JOIN tribes t ON t.id = tp.tribe_id AND t.status = 'active'
               WHERE p.id = $1 AND p.status = 'active'
               LIMIT 1""",
            page_row["project_id"],
        )
    if not path_row:
        return
    routing_path = (
        f"/app/tribes/{path_row['tribe_url_param_id']}"
        f"/projects/{path_row['project_url_param_id']}"
        f"/documents/{page_row['pd_url_param_id']}"
    )
    await _upsert(pool, "page", page_id, page_row["content_text"],
                  page_row["content_summary"], routing_path, user_id, now)


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
    routing_path: str,
    user_id: str,
    now: datetime,
) -> None:
    async with pool.acquire() as conn:
        await conn.execute(
            """INSERT INTO search_index
                   (entity_type, entity_id, content_text, content_summary,
                    routing_path, status, created_at, updated_at, created_by, updated_by)
               VALUES ($1, $2, $3, $4, $5, 'active', $6, $6, $7, $7)
               ON CONFLICT (entity_type, entity_id) DO UPDATE SET
                   content_text = EXCLUDED.content_text,
                   content_summary = EXCLUDED.content_summary,
                   routing_path = EXCLUDED.routing_path,
                   status = 'active',
                   updated_at = EXCLUDED.updated_at,
                   updated_by = EXCLUDED.updated_by""",
            entity_type,
            UUID(entity_id),
            content_text,
            content_summary,
            routing_path,
            now,
            UUID(user_id),
        )
