import json
from typing import List
from uuid import UUID

from fastapi import HTTPException, status

from ..models.app.document_page import (
    DocumentPageCreate, DocumentPageUpdate,
    DocumentPageResponse,
)
from ..models.uploads.files import AttachmentFile
from ..repositories import document_page_repository as repo


async def _verify_document_belongs_to_project(pool, project_id: str, project_document_id: str) -> None:
    async with pool.acquire() as conn:
        row = await conn.fetchrow(
            "SELECT id FROM projects_documents WHERE id = $1 AND project_id = $2",
            UUID(project_document_id), UUID(project_id),
        )
    if not row:
        raise HTTPException(status_code=status.HTTP_404_NOT_FOUND, detail="Document not found in project")


async def _verify_page_belongs_to_document(pool, project_document_id: str, page_id: str) -> None:
    async with pool.acquire() as conn:
        row = await conn.fetchrow(
            "SELECT id FROM document_pages WHERE id = $1 AND project_document_id = $2",
            UUID(page_id), UUID(project_document_id),
        )
    if not row:
        raise HTTPException(status_code=status.HTTP_404_NOT_FOUND, detail="Page not found")


def _build_response(row: dict) -> DocumentPageResponse:
    raw = row.get('attachments') or '[]'
    if isinstance(raw, str):
        raw = json.loads(raw)
    attachments = [AttachmentFile(**a) if isinstance(a, dict) else a for a in raw]
    return DocumentPageResponse(
        id=row['id'],
        url_param_id=row['url_param_id'],
        project_document_id=row['project_document_id'],
        title=row['title'],
        content_html=row['content_html'],
        content_summary=row.get('content_summary'),
        attachments=attachments,
        order_index=row['order_index'],
        status=row['status'],
        created_at=row['created_at'],
        updated_at=row['updated_at'],
        created_by=row.get('created_by'),
        updated_by=row.get('updated_by'),
    )



async def create_page(
    project_id: str,
    project_document_id: str,
    data: DocumentPageCreate,
    pool,
    current_user: dict,
) -> DocumentPageResponse:
    await _verify_document_belongs_to_project(pool, project_id, project_document_id)
    row = await repo.create_page(
        pool,
        project_document_id=project_document_id,
        title=data.title,
        content_html=data.content_html,
        attachments=data.attachments,
        order_index=data.order_index,
        user_id=str(current_user['id']),
    )
    return _build_response(row)


async def get_page(
    project_id: str,
    project_document_id: str,
    page_id: str,
    pool,
) -> DocumentPageResponse:
    await _verify_document_belongs_to_project(pool, project_id, project_document_id)
    await _verify_page_belongs_to_document(pool, project_document_id, page_id)
    row = await repo.get_page(pool, page_id)
    if not row:
        raise HTTPException(status_code=status.HTTP_404_NOT_FOUND, detail="Page not found")
    return _build_response(row)


async def list_pages(
    project_id: str,
    project_document_id: str,
    pool,
) -> List[DocumentPageResponse]:
    await _verify_document_belongs_to_project(pool, project_id, project_document_id)
    rows = await repo.list_pages(pool, project_document_id)
    return [_build_response(r) for r in rows]


async def list_pages_for_publication(project_document_id: str, pool) -> List[DocumentPageResponse]:
    rows = await repo.list_pages(pool, project_document_id)
    return [_build_response(r) for r in rows]


async def update_page(
    project_id: str,
    project_document_id: str,
    page_id: str,
    data: DocumentPageUpdate,
    pool,
    current_user: dict,
) -> DocumentPageResponse:
    await _verify_document_belongs_to_project(pool, project_id, project_document_id)
    await _verify_page_belongs_to_document(pool, project_document_id, page_id)
    row = await repo.update_page(
        pool,
        page_id=page_id,
        title=data.title,
        content_html=data.content_html,
        attachments=data.attachments,
        order_index=data.order_index,
        user_id=str(current_user['id']),
    )
    if not row:
        raise HTTPException(status_code=status.HTTP_404_NOT_FOUND, detail="Page not found")
    return _build_response(row)


async def archive_page(
    project_id: str,
    project_document_id: str,
    page_id: str,
    pool,
    current_user: dict,
) -> None:
    await _verify_document_belongs_to_project(pool, project_id, project_document_id)
    await _verify_page_belongs_to_document(pool, project_document_id, page_id)
    archived = await repo.archive_page(pool, page_id, str(current_user['id']))
    if not archived:
        raise HTTPException(status_code=status.HTTP_404_NOT_FOUND, detail="Page not found")
