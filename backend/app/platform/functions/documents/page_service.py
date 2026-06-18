import json
from typing import List

from app.platform.functions.documents.page_models import DocumentPageResponse
from app.platform.core.uploads.files import AttachmentFile
from app.platform.functions.documents import page_repository as repo


def _build_response(row: dict) -> DocumentPageResponse:
    raw = row.get("attachments") or "[]"
    if isinstance(raw, str):
        raw = json.loads(raw)
    attachments = [AttachmentFile(**a) if isinstance(a, dict) else a for a in raw]
    return DocumentPageResponse(
        id=row["id"],
        url_param_id=row["url_param_id"],
        project_document_id=row["project_document_id"],
        title=row["title"],
        content_html=row["content_html"],
        content_summary=row.get("content_summary"),
        attachments=attachments,
        order_index=row["order_index"],
        status=row["status"],
        created_at=row["created_at"],
        updated_at=row["updated_at"],
        created_by=row.get("created_by"),
        updated_by=row.get("updated_by"),
    )


async def list_pages_for_publication(project_document_id: str, pool) -> List[DocumentPageResponse]:
    rows = await repo.list_pages(pool, project_document_id)
    return [_build_response(r) for r in rows]
