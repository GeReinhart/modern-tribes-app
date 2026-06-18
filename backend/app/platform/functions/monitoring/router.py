from datetime import datetime
from typing import List, Optional
from uuid import UUID

from fastapi import APIRouter, Depends, HTTPException, Query
from pydantic import BaseModel

from app.platform.core.database import get_database
from app.platform.core.authorization.models import PermissionEnum
from app.platform.core.authentication.router import get_current_user
from app.platform.core.authorization.router import require_permission_decorator

router = APIRouter(prefix="/monitoring", tags=["platform_monitoring"])


class RecentChange(BaseModel):
    entity: str
    entity_id: str
    entity_summary: Optional[str] = None
    entity_status: str = "active"
    created_at: datetime
    created_by: Optional[str] = None
    updated_at: datetime
    updated_by: Optional[str] = None


_QUERY = """
SELECT entity, entity_id, entity_summary, entity_status, created_at, created_by, updated_at, updated_by
FROM (

SELECT 'Person' AS entity,
       p.id::text AS entity_id,
       first_name || ' ' || last_name AS entity_summary,
       p.status AS entity_status,
       created_at, updated_at,
       (SELECT email FROM users WHERE id = p.created_by) AS created_by,
       (SELECT email FROM users WHERE id = p.updated_by) AS updated_by
FROM persons p
WHERE GREATEST(created_at, updated_at) >= NOW() - make_interval(hours => $1)

UNION ALL

SELECT 'User',
       u.id::text,
       email,
       u.status,
       created_at, updated_at,
       (SELECT email FROM users WHERE id = u.created_by),
       (SELECT email FROM users WHERE id = u.updated_by)
FROM users u
WHERE GREATEST(created_at, updated_at) >= NOW() - make_interval(hours => $1)

UNION ALL

SELECT 'Role',
       r.id::text,
       name,
       r.status,
       created_at, updated_at,
       (SELECT email FROM users WHERE id = r.created_by),
       (SELECT email FROM users WHERE id = r.updated_by)
FROM roles r
WHERE GREATEST(created_at, updated_at) >= NOW() - make_interval(hours => $1)

UNION ALL

SELECT 'Permission',
       pe.id::text,
       name,
       pe.status,
       created_at, updated_at,
       (SELECT email FROM users WHERE id = pe.created_by),
       (SELECT email FROM users WHERE id = pe.updated_by)
FROM permissions pe
WHERE GREATEST(created_at, updated_at) >= NOW() - make_interval(hours => $1)

UNION ALL

SELECT 'Label',
       l.id::text,
       name,
       l.status,
       created_at, updated_at,
       (SELECT email FROM users WHERE id = l.created_by),
       (SELECT email FROM users WHERE id = l.updated_by)
FROM labels l
WHERE GREATEST(created_at, updated_at) >= NOW() - make_interval(hours => $1)

UNION ALL

SELECT 'Document',
       d.id::text,
       LEFT(regexp_replace(content_html, '<[^>]*>', '', 'g'), 80),
       d.status,
       created_at, updated_at,
       (SELECT email FROM users WHERE id = d.created_by),
       (SELECT email FROM users WHERE id = d.updated_by)
FROM documents d
WHERE GREATEST(created_at, updated_at) >= NOW() - make_interval(hours => $1)

UNION ALL

SELECT 'Mail',
       m.id::text,
       m.subject,
       m.status,
       m.created_at, m.updated_at,
       (SELECT email FROM users WHERE id = m.created_by),
       (SELECT email FROM users WHERE id = m.updated_by)
FROM mails m
WHERE GREATEST(m.created_at, m.updated_at) >= NOW() - make_interval(hours => $1)

UNION ALL

SELECT 'Represents',
       rep.id::text,
       (SELECT login FROM users WHERE id = rep.user_id) || ' → ' || (SELECT first_name || ' ' || last_name FROM persons WHERE id = rep.person_id),
       rep.status,
       rep.created_at, rep.updated_at,
       (SELECT email FROM users WHERE id = rep.created_by),
       (SELECT email FROM users WHERE id = rep.updated_by)
FROM represents rep
WHERE GREATEST(rep.created_at, rep.updated_at) >= NOW() - make_interval(hours => $1)

) AS changes
WHERE ($2::text IS NULL OR created_by = $2 OR updated_by = $2)
  AND ($3::text IS NULL OR entity_status = $3)
ORDER BY GREATEST(created_at, updated_at) DESC
"""


class DocumentRevision(BaseModel):
    content_html: str
    updated_at: datetime
    updated_by: Optional[str] = None
    is_current: bool = False


_REVISIONS_QUERY = """
SELECT
    content_html,
    updated_at,
    (SELECT email FROM users WHERE id = updated_by) AS updated_by,
    true                                             AS is_current
FROM documents
WHERE id = $1::uuid

UNION ALL

SELECT
    rev->>'content_html',
    (rev->>'updated_at')::timestamptz,
    (SELECT email FROM users WHERE id = (rev->>'updated_by')::uuid),
    false
FROM documents,
     jsonb_array_elements(revisions) AS rev
WHERE id = $1::uuid

ORDER BY updated_at DESC
"""


@router.get("/documents/{document_id}/revisions", response_model=List[DocumentRevision])
@require_permission_decorator(PermissionEnum.ADMIN)
async def get_document_revisions(document_id: str, current_user: dict = Depends(get_current_user)):
    """Get all revision snapshots for a document, current version first.

    **Permissions:** admin
    """
    try:
        uid = UUID(document_id)
    except (ValueError, AttributeError):
        raise HTTPException(status_code=400, detail="Invalid document ID format")
    pool = get_database()
    async with pool.acquire() as conn:
        rows = await conn.fetch(_REVISIONS_QUERY, uid)
    if not rows:
        raise HTTPException(status_code=404, detail="Document not found")
    return [
        DocumentRevision(
            content_html=r["content_html"],
            updated_at=r["updated_at"],
            updated_by=r["updated_by"],
            is_current=r["is_current"],
        )
        for r in rows
    ]


@router.get("/recent-changes", response_model=List[RecentChange])
@require_permission_decorator(PermissionEnum.ADMIN)
async def get_recent_changes(
    hours: int = Query(default=4, ge=1, le=720),
    user_email: Optional[str] = Query(default=None),
    status: Optional[str] = Query(default=None),
    current_user: dict = Depends(get_current_user),
):
    """Get recent changes across all entities within the last N hours.

    **Permissions:** admin
    """
    pool = get_database()
    async with pool.acquire() as conn:
        rows = await conn.fetch(_QUERY, hours, user_email or None, status or None)
    return [
        RecentChange(
            entity=row["entity"],
            entity_id=row["entity_id"],
            entity_summary=row["entity_summary"],
            entity_status=row["entity_status"],
            created_at=row["created_at"],
            created_by=row["created_by"],
            updated_at=row["updated_at"],
            updated_by=row["updated_by"],
        )
        for row in rows
    ]
