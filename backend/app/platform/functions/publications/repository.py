from datetime import datetime, timezone
from typing import Optional
from uuid import UUID

from app.platform.core.utils.db_helpers import generate_url_param_id


async def insert_publication(pool, document_id: str, project_document_id: str, published_by: str) -> dict:
    now = datetime.now(timezone.utc)
    url_param_id = generate_url_param_id()
    async with pool.acquire() as conn:
        row = await conn.fetchrow(
            """INSERT INTO publications
                   (document_id, project_document_id, published_at, published_by,
                    status, url_param_id, created_at, updated_at)
               VALUES ($1, $2, $3, $4, 'active', $5, $3, $3)
               RETURNING id, url_param_id""",
            UUID(document_id),
            UUID(project_document_id),
            now,
            UUID(published_by),
            url_param_id,
        )
    return {"id": str(row["id"]), "url_param_id": row["url_param_id"]}


async def delete_publication_by_document(pool, document_id: str) -> str:
    async with pool.acquire() as conn:
        return await conn.execute("DELETE FROM publications WHERE document_id = $1", UUID(document_id))


async def delete_publication_by_id(pool, publication_id: str) -> str:
    async with pool.acquire() as conn:
        return await conn.execute("DELETE FROM publications WHERE id = $1", UUID(publication_id))


async def fetch_publication_by_id(pool, publication_id: str) -> Optional[dict]:
    async with pool.acquire() as conn:
        row = await conn.fetchrow(
            """SELECT pub.id, pub.url_param_id, pub.document_id, pub.project_document_id,
                      pub.published_at, pd.title, pd.toc_depth, d.content_html, d.content_summary,
                      u.login AS published_by_login,
                      COALESCE(ap.first_name || ' ' || ap.last_name, au.login) AS author_name
               FROM publications pub
               JOIN documents d ON d.id = pub.document_id
               JOIN projects_documents pd ON pd.id = pub.project_document_id
               LEFT JOIN users u ON u.id = pub.published_by
               LEFT JOIN users au ON au.id = d.created_by
               LEFT JOIN persons ap ON ap.id = au.person_id
               WHERE pub.id = $1 AND pub.status = 'active'""",
            UUID(publication_id),
        )
    return dict(row) if row else None


async def fetch_publication_id_by_document(pool, document_id: str) -> Optional[str]:
    async with pool.acquire() as conn:
        row = await conn.fetchrow(
            "SELECT id FROM publications WHERE document_id = $1 AND status = 'active'", UUID(document_id)
        )
    return str(row["id"]) if row else None


async def fetch_publication_labels(pool) -> list[dict]:
    async with pool.acquire() as conn:
        rows = await conn.fetch("""SELECT DISTINCT l.id, l.name FROM labels l
               JOIN label_entities le ON le.label_id = l.id
               JOIN publications pub ON pub.document_id = le.entity_id
               WHERE le.entity_type = 'document' AND l.status = 'active'
               AND pub.status = 'active'
               ORDER BY l.name ASC""")
    return [dict(r) for r in rows]


def _build_where(conditions: list, params: list) -> str:
    return ("WHERE " + " AND ".join(conditions)) if conditions else ""


async def fetch_publications(pool, q: Optional[str], label_id: Optional[str]) -> list[dict]:
    params: list = []
    conditions: list = []
    if label_id:
        conditions.append(
            f"EXISTS (SELECT 1 FROM label_entities le WHERE le.entity_type = 'document'"
            f" AND le.entity_id = pub.document_id AND le.label_id = ${len(params) + 1})"
        )
        params.append(UUID(label_id))
    if q and q.strip():
        conditions.append(
            f"to_tsvector('french', COALESCE(d.content_text, '')) "
            f"@@ websearch_to_tsquery('french', ${len(params) + 1})"
        )
        params.append(q.strip())
    where = _build_where(conditions, params)
    query = f"""
        SELECT pub.id, pub.url_param_id, pub.document_id, pub.project_document_id,
               pd.title, d.content_summary, pub.published_at
        FROM publications pub
        JOIN documents d ON d.id = pub.document_id
        JOIN projects_documents pd ON pd.id = pub.project_document_id
        WHERE pub.status = 'active' {"AND " + " AND ".join(conditions) if conditions else ""}
        ORDER BY pub.published_at DESC
    """
    async with pool.acquire() as conn:
        rows = await conn.fetch(query, *params)
    return [dict(r) for r in rows]


async def fetch_publications_admin(
    pool, q: Optional[str], tribe_id: Optional[str], project_id: Optional[str]
) -> list[dict]:
    params: list = []
    extra: list = []
    if q and q.strip():
        extra.append(
            f"to_tsvector('french', COALESCE(d.content_text, '')) "
            f"@@ websearch_to_tsquery('french', ${len(params) + 1})"
        )
        params.append(q.strip())
    extra_clause = ("AND " + " AND ".join(extra)) if extra else ""
    query = f"""
        SELECT pub.id, pub.url_param_id, pub.document_id, pub.project_document_id, pub.published_at,
               pd.title, d.content_summary,
               NULL::uuid AS tribe_id, NULL::text AS tribe_name,
               NULL::uuid AS project_id, NULL::text AS project_name,
               u.login AS published_by_login
        FROM publications pub
        JOIN documents d ON d.id = pub.document_id
        JOIN projects_documents pd ON pd.id = pub.project_document_id
        LEFT JOIN users u ON u.id = pub.published_by
        WHERE pub.status = 'active' {extra_clause}
        ORDER BY pub.published_at DESC
    """
    async with pool.acquire() as conn:
        rows = await conn.fetch(query, *params)
    return [dict(r) for r in rows]
