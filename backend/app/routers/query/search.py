from fastapi import APIRouter, Depends, Query, HTTPException, status
from pydantic import BaseModel
from typing import Optional
from uuid import UUID

from ..auth.authentification import get_current_user
from ..auth.authorization import require_any_permission_decorator
from ...models.auth.auth import PermissionEnum
from ...core.database import get_database
from ...utils.permissions_helper import get_user_permissions

router = APIRouter(prefix="/search", tags=["query_search"])


class SearchResult(BaseModel):
    document_id: str
    headline: str
    content_summary: Optional[str]
    tribe_id: Optional[str]
    tribe_name: Optional[str]
    project_id: Optional[str]
    project_name: Optional[str]


_HEADLINE_OPTIONS = "StartSel=<mark>,StopSel=</mark>,MaxFragments=3,MaxWords=30,MinWords=10"

_SEARCH_ADMIN = f"""
WITH tsq AS (SELECT websearch_to_tsquery('french', $1) AS query),
accessible_docs AS (
    SELECT d.id AS document_id, t.id::text AS tribe_id, t.name AS tribe_name,
           NULL::text AS project_id, NULL::text AS project_name
    FROM documents d
    JOIN tribes t ON t.document_id = d.id AND t.status = 'active'
    WHERE d.status = 'active'

    UNION ALL

    SELECT d.id AS document_id, t.id::text AS tribe_id, t.name AS tribe_name,
           proj.id::text AS project_id, proj.name AS project_name
    FROM documents d
    JOIN projects proj ON proj.document_id = d.id AND proj.status = 'active'
    JOIN tribes_projects tp ON tp.project_id = proj.id
    JOIN tribes t ON t.id = tp.tribe_id AND t.status = 'active'
    WHERE d.status = 'active'

    UNION ALL

    SELECT d.id AS document_id, t.id::text AS tribe_id, t.name AS tribe_name,
           proj.id::text AS project_id, proj.name AS project_name
    FROM documents d
    JOIN projects_documents pd ON pd.document_id = d.id AND pd.status = 'active'
    JOIN projects proj ON proj.id = pd.project_id AND proj.status = 'active'
    JOIN tribes_projects tp ON tp.project_id = proj.id
    JOIN tribes t ON t.id = tp.tribe_id AND t.status = 'active'
    WHERE d.status = 'active'
),
deduped AS (
    SELECT DISTINCT ON (document_id) document_id, tribe_id, tribe_name, project_id, project_name
    FROM accessible_docs
    ORDER BY document_id
)
SELECT
    deduped.document_id::text,
    d.content_summary,
    ts_headline('french', d.content_text, tsq.query, '{_HEADLINE_OPTIONS}') AS headline,
    deduped.tribe_id,
    deduped.tribe_name,
    deduped.project_id,
    deduped.project_name,
    ts_rank(to_tsvector('french', d.content_text), tsq.query) AS rank
FROM deduped
JOIN documents d ON d.id = deduped.document_id
CROSS JOIN tsq
WHERE d.content_text IS NOT NULL AND d.content_text != ''
  AND to_tsvector('french', d.content_text) @@ tsq.query
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
accessible_docs AS (
    SELECT d.id AS document_id, t.id::text AS tribe_id, t.name AS tribe_name,
           NULL::text AS project_id, NULL::text AS project_name
    FROM documents d
    JOIN tribes t ON t.document_id = d.id AND t.status = 'active'
    WHERE d.status = 'active'
      AND t.id IN (SELECT tribe_id FROM user_tribe_ids)

    UNION ALL

    SELECT d.id AS document_id, t.id::text AS tribe_id, t.name AS tribe_name,
           proj.id::text AS project_id, proj.name AS project_name
    FROM documents d
    JOIN projects proj ON proj.document_id = d.id AND proj.status = 'active'
    JOIN tribes_projects tp ON tp.project_id = proj.id
    JOIN tribes t ON t.id = tp.tribe_id AND t.status = 'active'
    WHERE d.status = 'active'
      AND t.id IN (SELECT tribe_id FROM user_tribe_ids)

    UNION ALL

    SELECT d.id AS document_id, t.id::text AS tribe_id, t.name AS tribe_name,
           proj.id::text AS project_id, proj.name AS project_name
    FROM documents d
    JOIN projects_documents pd ON pd.document_id = d.id AND pd.status = 'active'
    JOIN projects proj ON proj.id = pd.project_id AND proj.status = 'active'
    JOIN tribes_projects tp ON tp.project_id = proj.id
    JOIN tribes t ON t.id = tp.tribe_id AND t.status = 'active'
    WHERE d.status = 'active'
      AND t.id IN (SELECT tribe_id FROM user_tribe_ids)
),
deduped AS (
    SELECT DISTINCT ON (document_id) document_id, tribe_id, tribe_name, project_id, project_name
    FROM accessible_docs
    ORDER BY document_id
)
SELECT
    deduped.document_id::text,
    d.content_summary,
    ts_headline('french', d.content_text, tsq.query, '{_HEADLINE_OPTIONS}') AS headline,
    deduped.tribe_id,
    deduped.tribe_name,
    deduped.project_id,
    deduped.project_name,
    ts_rank(to_tsvector('french', d.content_text), tsq.query) AS rank
FROM deduped
JOIN documents d ON d.id = deduped.document_id
CROSS JOIN tsq
WHERE d.content_text IS NOT NULL AND d.content_text != ''
  AND to_tsvector('french', d.content_text) @@ tsq.query
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
        )
        for r in rows
    ]
