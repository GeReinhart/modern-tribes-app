from datetime import datetime, timezone
from typing import List, Optional
from uuid import UUID

from fastapi import HTTPException, status

from app.models.app.project_document import (
    LabelInfo,
    ProjectDocumentCreate,
    ProjectDocumentLabel,
    ProjectDocumentResponse,
    ProjectDocumentSummary,
    ProjectDocumentUpdate,
)
from app.models.uploads.files import AttachmentFile
from app.utils.attachments_helpers import (
    create_document_with_attachments,
    get_document_with_attachments,
    update_document_attachments,
)
from app.platform.search import index_repository as search_index_repo
from app.utils.db_helpers import generate_url_param_id, row_to_dict
from app.utils.document_helpers import update_document_content_with_revision


async def _upsert_label(pool, name: str) -> str:
    """Find or create a label by name (case-insensitive). Returns label id."""
    async with pool.acquire() as conn:
        row = await conn.fetchrow(
            "SELECT id FROM labels WHERE LOWER(name) = LOWER($1) AND status = 'active' LIMIT 1", name
        )
        if row:
            return str(row["id"])
        row = await conn.fetchrow(
            "INSERT INTO labels (name, status) VALUES ($1, 'active') RETURNING id", name
        )
        return str(row["id"])


async def _sync_document_labels(pool, document_id: str, label_names: List[str]) -> None:
    """Replace all label_entities for a document with the given label names."""
    async with pool.acquire() as conn:
        await conn.execute(
            "DELETE FROM label_entities WHERE entity_type = 'document' AND entity_id = $1", UUID(document_id)
        )

    for name in label_names:
        if not name.strip():
            continue
        label_id = await _upsert_label(pool, name.strip())
        async with pool.acquire() as conn:
            await conn.execute(
                "INSERT INTO label_entities (label_id, entity_type, entity_id) VALUES ($1, 'document', $2)",
                UUID(label_id),
                UUID(document_id),
            )


async def _get_document_labels(pool, document_id: str) -> List[LabelInfo]:
    async with pool.acquire() as conn:
        rows = await conn.fetch(
            """SELECT l.id, l.name FROM labels l
               JOIN label_entities le ON le.label_id = l.id
               WHERE le.entity_type = 'document' AND le.entity_id = $1 AND l.status = 'active'
               ORDER BY l.name ASC""",
            UUID(document_id),
        )
    return [LabelInfo(id=str(r["id"]), name=r["name"]) for r in rows]


async def _build_response(pd_row: dict, pool) -> ProjectDocumentResponse:
    document = await get_document_with_attachments(pool, str(pd_row["document_id"]))
    if not document:
        raise HTTPException(status_code=status.HTTP_404_NOT_FOUND, detail="Document content not found")

    attachments = [
        AttachmentFile(**att) if isinstance(att, dict) else att for att in document.get("attachments", [])
    ]
    labels = await _get_document_labels(pool, str(pd_row["document_id"]))

    async with pool.acquire() as conn:
        pub_row = await conn.fetchrow(
            "SELECT url_param_id FROM publications WHERE document_id = $1", UUID(str(pd_row["document_id"]))
        )
    publication_url_param_id = pub_row["url_param_id"] if pub_row else None

    return ProjectDocumentResponse(
        id=str(pd_row["id"]),
        url_param_id=pd_row["url_param_id"],
        project_id=str(pd_row["project_id"]),
        document_id=str(pd_row["document_id"]),
        title=pd_row["title"],
        content_html=document.get("content_html", ""),
        content_summary=document.get("content_summary"),
        attachments=attachments,
        labels=labels,
        toc_depth=pd_row.get("toc_depth") or 4,
        status=pd_row["status"],
        publication_url_param_id=publication_url_param_id,
        created_at=pd_row["created_at"],
        updated_at=pd_row["updated_at"],
        created_by=str(pd_row["created_by"]) if pd_row.get("created_by") else None,
        updated_by=str(pd_row["updated_by"]) if pd_row.get("updated_by") else None,
    )


async def create_project_document(
    project_id: str, data: ProjectDocumentCreate, pool, current_user: dict
) -> ProjectDocumentResponse:
    now = datetime.now(timezone.utc)
    uid = UUID(str(current_user["id"]))

    async with pool.acquire() as conn:
        proj = await conn.fetchrow(
            "SELECT id FROM projects WHERE id = $1 AND status = 'active'", UUID(project_id)
        )
    if not proj:
        raise HTTPException(status_code=status.HTTP_404_NOT_FOUND, detail="Project not found")

    document = await create_document_with_attachments(
        pool, data.content_html, data.attachments, current_user["id"]
    )
    document_id = str(document["id"])

    if data.label_names:
        await _sync_document_labels(pool, document_id, data.label_names)

    url_param_id = generate_url_param_id()
    async with pool.acquire() as conn:
        pd_row = await conn.fetchrow(
            """INSERT INTO projects_documents
                   (project_id, document_id, title, toc_depth, status, url_param_id, created_at, updated_at, created_by, updated_by)
               VALUES ($1, $2, $3, $4, 'active', $5, $6, $6, $7, $7)
               RETURNING *""",
            UUID(project_id),
            UUID(document_id),
            data.title,
            data.toc_depth,
            url_param_id,
            now,
            uid,
        )

    pd = row_to_dict(pd_row)
    await search_index_repo.index_projects_document(pool, str(pd["id"]), str(uid))
    return await _build_response(pd, pool)


async def get_project_document(project_id: str, project_document_id: str, pool) -> ProjectDocumentResponse:
    async with pool.acquire() as conn:
        pd_row = await conn.fetchrow(
            "SELECT * FROM projects_documents WHERE id = $1 AND project_id = $2",
            UUID(project_document_id),
            UUID(project_id),
        )
    if not pd_row:
        raise HTTPException(status_code=status.HTTP_404_NOT_FOUND, detail="Document not found")

    return await _build_response(row_to_dict(pd_row), pool)


async def list_project_documents(
    project_id: str,
    pool,
    search_query: Optional[str] = None,
    label_id: Optional[str] = None,
) -> List[ProjectDocumentSummary]:
    params: list = [UUID(project_id)]
    conditions = ["pd.project_id = $1", "pd.status = 'active'"]

    if label_id:
        conditions.append(
            f"EXISTS (SELECT 1 FROM label_entities le WHERE le.entity_type = 'document' AND le.entity_id = pd.document_id AND le.label_id = ${len(params) + 1})"
        )
        params.append(UUID(label_id))

    if search_query and search_query.strip():
        conditions.append(
            f"to_tsvector('french', COALESCE(d.content_text, '')) @@ plainto_tsquery('french', ${len(params) + 1})"
        )
        params.append(search_query.strip())

    where_clause = " AND ".join(conditions)
    query = f"""
        SELECT pd.id, pd.url_param_id, pd.document_id, pd.title, pd.status,
               pd.created_at, pd.updated_at,
               pd.created_by::text AS created_by, pd.updated_by::text AS updated_by,
               d.content_summary, pub.url_param_id AS publication_url_param_id
        FROM projects_documents pd
        JOIN documents d ON d.id = pd.document_id
        LEFT JOIN publications pub ON pub.document_id = pd.document_id
        WHERE {where_clause}
        ORDER BY pd.updated_at DESC
    """

    async with pool.acquire() as conn:
        rows = await conn.fetch(query, *params)

    results = []
    for row in rows:
        document_id = str(row["document_id"])
        labels = await _get_document_labels(pool, document_id)
        results.append(
            ProjectDocumentSummary(
                id=str(row["id"]),
                url_param_id=row["url_param_id"],
                document_id=document_id,
                title=row["title"],
                content_summary=row["content_summary"],
                labels=labels,
                status=row["status"],
                publication_url_param_id=row["publication_url_param_id"],
                created_at=row["created_at"],
                updated_at=row["updated_at"],
                created_by=row["created_by"],
                updated_by=row["updated_by"],
            )
        )

    return results


async def update_project_document(
    project_id: str,
    project_document_id: str,
    data: ProjectDocumentUpdate,
    pool,
    current_user: dict,
) -> ProjectDocumentResponse:
    now = datetime.now(timezone.utc)
    uid = UUID(str(current_user["id"]))

    async with pool.acquire() as conn:
        pd_row = await conn.fetchrow(
            "SELECT * FROM projects_documents WHERE id = $1 AND project_id = $2",
            UUID(project_document_id),
            UUID(project_id),
        )
    if not pd_row:
        raise HTTPException(status_code=status.HTTP_404_NOT_FOUND, detail="Document not found")

    pd = row_to_dict(pd_row)
    document_id = str(pd["document_id"])

    if data.title is not None:
        async with pool.acquire() as conn:
            await conn.execute(
                "UPDATE projects_documents SET title = $1, updated_at = $2, updated_by = $3 WHERE id = $4",
                data.title,
                now,
                uid,
                UUID(project_document_id),
            )

    if data.toc_depth is not None:
        async with pool.acquire() as conn:
            await conn.execute(
                "UPDATE projects_documents SET toc_depth = $1, updated_at = $2, updated_by = $3 WHERE id = $4",
                data.toc_depth,
                now,
                uid,
                UUID(project_document_id),
            )

    if data.content_html is not None:
        await update_document_content_with_revision(pool, document_id, data.content_html, current_user["id"])
        await search_index_repo.index_projects_document(
            pool, project_document_id, str(current_user["id"])
        )

    if data.attachments is not None:
        await update_document_attachments(pool, document_id, data.attachments, current_user["id"])

    if data.label_names is not None:
        await _sync_document_labels(pool, document_id, data.label_names)

    return await get_project_document(project_id, project_document_id, pool)


async def archive_project_document(
    project_id: str, project_document_id: str, pool, current_user: dict
) -> None:
    now = datetime.now(timezone.utc)
    uid = UUID(str(current_user["id"]))

    async with pool.acquire() as conn:
        pd_row = await conn.fetchrow(
            "SELECT document_id FROM projects_documents WHERE id = $1 AND project_id = $2",
            UUID(project_document_id),
            UUID(project_id),
        )

    if not pd_row:
        raise HTTPException(status_code=status.HTTP_404_NOT_FOUND, detail="Document not found")

    async with pool.acquire() as conn:
        await conn.execute(
            """UPDATE projects_documents SET status = 'archived', updated_at = $1, updated_by = $2
               WHERE id = $3 AND project_id = $4""",
            now,
            uid,
            UUID(project_document_id),
            UUID(project_id),
        )

    await search_index_repo.archive_entity(
        pool, "document", str(pd_row["document_id"]), str(current_user["id"])
    )


async def get_project_document_labels(project_id: str, pool) -> List[ProjectDocumentLabel]:
    async with pool.acquire() as conn:
        rows = await conn.fetch(
            """SELECT l.id, l.name, COUNT(le.id) AS usage_count
               FROM labels l
               JOIN label_entities le ON le.label_id = l.id AND le.entity_type = 'document'
               JOIN projects_documents pd ON pd.document_id = le.entity_id
               WHERE pd.project_id = $1 AND pd.status = 'active' AND l.status = 'active'
               GROUP BY l.id, l.name
               ORDER BY usage_count DESC, l.name ASC""",
            UUID(project_id),
        )
    return [ProjectDocumentLabel(id=str(r["id"]), name=r["name"], usage_count=r["usage_count"]) for r in rows]
