from typing import List, Optional
from uuid import UUID

from fastapi import HTTPException, status

from app.models.app.project_document import LabelInfo
from app.models.app.publication import (
    PublicationAdminItem,
    PublicationDetail,
    PublicationSummary,
)
from app.models.uploads.files import AttachmentFile
from app.repositories import publication_repository
from app.services import document_page_service as page_svc
from app.utils.attachments_helpers import get_document_with_attachments


async def _get_labels(pool, document_id: str) -> List[LabelInfo]:
    async with pool.acquire() as conn:
        rows = await conn.fetch(
            """SELECT l.id, l.name FROM labels l
               JOIN label_entities le ON le.label_id = l.id
               WHERE le.entity_type = 'document' AND le.entity_id = $1 AND l.status = 'active'
               ORDER BY l.name ASC""",
            UUID(document_id),
        )
    return [LabelInfo(id=str(r["id"]), name=r["name"]) for r in rows]


async def _resolve_project_document(project_id: str, project_document_id: str, pool) -> dict:
    async with pool.acquire() as conn:
        row = await conn.fetchrow(
            "SELECT * FROM projects_documents WHERE id = $1 AND project_id = $2 AND status = 'active'",
            UUID(project_document_id),
            UUID(project_id),
        )
    if not row:
        raise HTTPException(status_code=status.HTTP_404_NOT_FOUND, detail="Document not found")
    return dict(row)


async def publish_document(project_id: str, project_document_id: str, pool, current_user: dict) -> dict:
    pd = await _resolve_project_document(project_id, project_document_id, pool)
    existing = await publication_repository.fetch_publication_id_by_document(pool, str(pd["document_id"]))
    if existing:
        raise HTTPException(status_code=status.HTTP_409_CONFLICT, detail="Document is already published")
    result = await publication_repository.insert_publication(
        pool, str(pd["document_id"]), project_document_id, str(current_user["id"])
    )
    return {"publication_url_param_id": result["url_param_id"]}


async def unpublish_document(project_id: str, project_document_id: str, pool, current_user: dict) -> None:
    pd = await _resolve_project_document(project_id, project_document_id, pool)
    result = await publication_repository.delete_publication_by_document(pool, str(pd["document_id"]))
    if result == "DELETE 0":
        raise HTTPException(status_code=status.HTTP_404_NOT_FOUND, detail="Publication not found")


async def get_publication(publication_id: str, pool) -> PublicationDetail:
    row = await publication_repository.fetch_publication_by_id(pool, publication_id)
    if not row:
        raise HTTPException(status_code=status.HTTP_404_NOT_FOUND, detail="Publication not found")
    return await _build_publication_detail(row, pool)


async def _build_publication_detail(row: dict, pool) -> PublicationDetail:
    document = await get_document_with_attachments(pool, str(row["document_id"]))
    attachments = _extract_attachments(document)
    labels = await _get_labels(pool, str(row["document_id"]))
    pages = await page_svc.list_pages_for_publication(str(row["project_document_id"]), pool)
    return PublicationDetail(
        id=str(row["id"]),
        url_param_id=row["url_param_id"],
        document_id=str(row["document_id"]),
        project_document_id=str(row["project_document_id"]),
        title=row["title"],
        content_html=(document or {}).get("content_html") or "",
        content_summary=(document or {}).get("content_summary"),
        labels=labels,
        attachments=attachments,
        pages=pages,
        toc_depth=row.get("toc_depth") or 4,
        published_at=row["published_at"],
        published_by_login=row.get("published_by_login"),
        author_name=row.get("author_name"),
    )


def _extract_attachments(document: Optional[dict]) -> List[AttachmentFile]:
    if not document:
        return []
    return [
        AttachmentFile(**att) if isinstance(att, dict) else att for att in document.get("attachments", [])
    ]


async def list_publications(
    pool, q: Optional[str] = None, label_id: Optional[str] = None
) -> List[PublicationSummary]:
    rows = await publication_repository.fetch_publications(pool, q, label_id)
    results = []
    for row in rows:
        labels = await _get_labels(pool, str(row["document_id"]))
        results.append(_row_to_publication_summary(row, labels))
    return results


def _row_to_publication_summary(row: dict, labels: List[LabelInfo]) -> PublicationSummary:
    return PublicationSummary(
        id=str(row["id"]),
        url_param_id=row["url_param_id"],
        document_id=str(row["document_id"]),
        project_document_id=str(row["project_document_id"]),
        title=row["title"],
        content_summary=row["content_summary"],
        labels=labels,
        published_at=row["published_at"],
    )


async def list_publication_labels(pool) -> List[LabelInfo]:
    rows = await publication_repository.fetch_publication_labels(pool)
    return [LabelInfo(id=str(r["id"]), name=r["name"]) for r in rows]


async def list_publications_admin(
    pool,
    q: Optional[str] = None,
    tribe_id: Optional[str] = None,
    project_id: Optional[str] = None,
) -> List[PublicationAdminItem]:
    rows = await publication_repository.fetch_publications_admin(pool, q, tribe_id, project_id)
    rows = sorted(rows, key=lambda r: r["published_at"], reverse=True)
    results = []
    for row in rows:
        labels = await _get_labels(pool, str(row["document_id"]))
        results.append(_row_to_admin_item(row, labels))
    return results


def _row_to_admin_item(row: dict, labels: List[LabelInfo]) -> PublicationAdminItem:
    return PublicationAdminItem(
        id=str(row["id"]),
        url_param_id=row["url_param_id"],
        document_id=str(row["document_id"]),
        project_document_id=str(row["project_document_id"]),
        title=row["title"],
        content_summary=row["content_summary"],
        labels=labels,
        tribe_id=str(row["tribe_id"]),
        tribe_name=row["tribe_name"],
        project_id=str(row["project_id"]),
        project_name=row["project_name"],
        published_at=row["published_at"],
        published_by_login=row.get("published_by_login"),
    )


async def admin_unpublish(publication_id: str, pool) -> None:
    result = await publication_repository.delete_publication_by_id(pool, publication_id)
    if result == "DELETE 0":
        raise HTTPException(status_code=status.HTTP_404_NOT_FOUND, detail="Publication not found")


async def get_publication_id_for_document(document_id: str, pool) -> Optional[str]:
    return await publication_repository.fetch_publication_id_by_document(pool, document_id)
