from typing import Optional
from uuid import UUID

from fastapi import APIRouter, Depends, HTTPException, Query, status
from pydantic import BaseModel

from app.core.database import get_database
from app.platform.authorization.models import PermissionEnum
from app.platform.authentication.router import get_current_user
from app.platform.authorization.router import require_any_permission_decorator
from app.platform.authorization.permissions import get_user_permissions

router = APIRouter(prefix="/search", tags=["query_search"])


class SearchResult(BaseModel):
    document_id: str
    headline: str
    content_summary: Optional[str]
    tribe_id: Optional[str]
    tribe_name: Optional[str]
    project_id: Optional[str]
    project_name: Optional[str]
    page_id: Optional[str] = None
    project_document_id: Optional[str] = None


_HEADLINE_OPTIONS = "StartSel=<mark>,StopSel=</mark>,MaxFragments=3,MaxWords=30,MinWords=10"

_SEARCH_ADMIN = f"""
WITH tsq AS (SELECT websearch_to_tsquery('french', $1) AS query),
all_sources AS (
    SELECT d.id AS content_id, d.content_text, d.content_summary,
           t.id::text AS tribe_id, t.name AS tribe_name,
           NULL::text AS project_id, NULL::text AS project_name,
           NULL::text AS page_id, NULL::text AS project_document_id
    FROM documents d
    JOIN tribes t ON t.document_id = d.id AND t.status = 'active'
    WHERE d.status = 'active'

    UNION ALL

    SELECT d.id, d.content_text, d.content_summary,
           t.id::text, t.name,
           proj.id::text, proj.name,
           NULL::text, NULL::text
    FROM documents d
    JOIN projects proj ON proj.document_id = d.id AND proj.status = 'active'
    JOIN tribes_projects tp ON tp.project_id = proj.id
    JOIN tribes t ON t.id = tp.tribe_id AND t.status = 'active'
    WHERE d.status = 'active'

    UNION ALL

    SELECT d.id, d.content_text, d.content_summary,
           t.id::text, t.name,
           proj.id::text, proj.name,
           NULL::text, pd.url_param_id
    FROM documents d
    JOIN projects_documents pd ON pd.document_id = d.id AND pd.status = 'active'
    JOIN projects proj ON proj.id = pd.project_id AND proj.status = 'active'
    JOIN tribes_projects tp ON tp.project_id = proj.id
    JOIN tribes t ON t.id = tp.tribe_id AND t.status = 'active'
    WHERE d.status = 'active'

    UNION ALL

    SELECT dp.id, dp.content_text, dp.content_summary,
           t.id::text, t.name,
           proj.id::text, proj.name,
           dp.url_param_id, pd.url_param_id
    FROM document_pages dp
    JOIN projects_documents pd ON pd.id = dp.project_document_id AND pd.status = 'active'
    JOIN projects proj ON proj.id = pd.project_id AND proj.status = 'active'
    JOIN tribes_projects tp ON tp.project_id = proj.id
    JOIN tribes t ON t.id = tp.tribe_id AND t.status = 'active'
    WHERE dp.status = 'active'
),
deduped AS (
    SELECT DISTINCT ON (content_id) content_id, content_text, content_summary,
           tribe_id, tribe_name, project_id, project_name, page_id, project_document_id
    FROM all_sources
    ORDER BY content_id
)
SELECT
    deduped.content_id::text AS document_id,
    deduped.content_summary,
    ts_headline('french', deduped.content_text, tsq.query, '{_HEADLINE_OPTIONS}') AS headline,
    deduped.tribe_id,
    deduped.tribe_name,
    deduped.project_id,
    deduped.project_name,
    deduped.page_id,
    deduped.project_document_id,
    ts_rank(to_tsvector('french', deduped.content_text), tsq.query) AS rank
FROM deduped
CROSS JOIN tsq
WHERE deduped.content_text IS NOT NULL AND deduped.content_text != ''
  AND to_tsvector('french', deduped.content_text) @@ tsq.query
ORDER BY rank DESC
LIMIT 50
"""

_SEARCH_USER = f"""
WITH user_tribe_ids AS (
    SELECT DISTINCT pos.tribe_id
    FROM positions pos
    JOIN persons p ON p.id = pos.person_id AND p.status = 'active'
    JOIN users u ON u.person_id = p.id
    WHERE u.id = $1 AND pos.status = 'active'

    UNION

    SELECT DISTINCT pos.tribe_id
    FROM positions pos
    JOIN represents r ON r.person_id = pos.person_id AND r.status = 'active'
    WHERE r.user_id = $1 AND pos.status = 'active'
),
tsq AS (SELECT websearch_to_tsquery('french', $2) AS query),
all_sources AS (
    SELECT d.id AS content_id, d.content_text, d.content_summary,
           t.id::text AS tribe_id, t.name AS tribe_name,
           NULL::text AS project_id, NULL::text AS project_name,
           NULL::text AS page_id, NULL::text AS project_document_id
    FROM documents d
    JOIN tribes t ON t.document_id = d.id AND t.status = 'active'
    WHERE d.status = 'active'
      AND t.id IN (SELECT tribe_id FROM user_tribe_ids)

    UNION ALL

    SELECT d.id, d.content_text, d.content_summary,
           t.id::text, t.name,
           proj.id::text, proj.name,
           NULL::text, NULL::text
    FROM documents d
    JOIN projects proj ON proj.document_id = d.id AND proj.status = 'active'
    JOIN tribes_projects tp ON tp.project_id = proj.id
    JOIN tribes t ON t.id = tp.tribe_id AND t.status = 'active'
    WHERE d.status = 'active'
      AND t.id IN (SELECT tribe_id FROM user_tribe_ids)

    UNION ALL

    SELECT d.id, d.content_text, d.content_summary,
           t.id::text, t.name,
           proj.id::text, proj.name,
           NULL::text, pd.url_param_id
    FROM documents d
    JOIN projects_documents pd ON pd.document_id = d.id AND pd.status = 'active'
    JOIN projects proj ON proj.id = pd.project_id AND proj.status = 'active'
    JOIN tribes_projects tp ON tp.project_id = proj.id
    JOIN tribes t ON t.id = tp.tribe_id AND t.status = 'active'
    WHERE d.status = 'active'
      AND t.id IN (SELECT tribe_id FROM user_tribe_ids)

    UNION ALL

    SELECT dp.id, dp.content_text, dp.content_summary,
           t.id::text, t.name,
           proj.id::text, proj.name,
           dp.url_param_id, pd.url_param_id
    FROM document_pages dp
    JOIN projects_documents pd ON pd.id = dp.project_document_id AND pd.status = 'active'
    JOIN projects proj ON proj.id = pd.project_id AND proj.status = 'active'
    JOIN tribes_projects tp ON tp.project_id = proj.id
    JOIN tribes t ON t.id = tp.tribe_id AND t.status = 'active'
    WHERE dp.status = 'active'
      AND t.id IN (SELECT tribe_id FROM user_tribe_ids)
),
deduped AS (
    SELECT DISTINCT ON (content_id) content_id, content_text, content_summary,
           tribe_id, tribe_name, project_id, project_name, page_id, project_document_id
    FROM all_sources
    ORDER BY content_id
)
SELECT
    deduped.content_id::text AS document_id,
    deduped.content_summary,
    ts_headline('french', deduped.content_text, tsq.query, '{_HEADLINE_OPTIONS}') AS headline,
    deduped.tribe_id,
    deduped.tribe_name,
    deduped.project_id,
    deduped.project_name,
    deduped.page_id,
    deduped.project_document_id,
    ts_rank(to_tsvector('french', deduped.content_text), tsq.query) AS rank
FROM deduped
CROSS JOIN tsq
WHERE deduped.content_text IS NOT NULL AND deduped.content_text != ''
  AND to_tsvector('french', deduped.content_text) @@ tsq.query
ORDER BY rank DESC
LIMIT 50
"""


@router.get("/", response_model=list[SearchResult])
@require_any_permission_decorator(PermissionEnum.ADMIN, PermissionEnum.CAN_ACCESS_OWN_TRIBES)
async def search_documents(
    q: str = Query(..., min_length=2, description="Full-text search query"),
    current_user: dict = Depends(get_current_user),
):
    if not q.strip():
        return []

    pool = get_database()
    user_id = UUID(str(current_user["id"]))
    user_permissions = await get_user_permissions(pool, str(user_id))

    try:
        async with pool.acquire() as conn:
            if PermissionEnum.ADMIN in user_permissions:
                rows = await conn.fetch(_SEARCH_ADMIN, q)
            else:
                rows = await conn.fetch(_SEARCH_USER, user_id, q)
    except Exception:
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail="Invalid search query",
        )

    return [
        SearchResult(
            document_id=str(r["document_id"]),
            headline=r["headline"],
            content_summary=r["content_summary"],
            tribe_id=r["tribe_id"],
            tribe_name=r["tribe_name"],
            project_id=r["project_id"],
            project_name=r["project_name"],
            page_id=r["page_id"],
            project_document_id=r["project_document_id"],
        )
        for r in rows
    ]
