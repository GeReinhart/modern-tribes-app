from typing import List, Optional

from fastapi import APIRouter, Depends, Query

from ..auth.authentification import get_current_user
from ..auth.authorization import require_permission_decorator
from ...models.auth.auth import PermissionEnum
from ...models.crud.mails import MailWithRecipients
from ...core.database import get_database

router = APIRouter(prefix="/mails", tags=["query_mails"])

_QUERY = """
SELECT
    m.id::text,
    m.subject,
    m.content_html,
    m.mail_type,
    m.mail_status,
    m.planned_at,
    m.sent_at,
    m.status,
    m.created_at,
    m.updated_at,
    (SELECT email FROM users WHERE id = m.created_by) AS created_by,
    (SELECT email FROM users WHERE id = m.updated_by) AS updated_by,
    COALESCE(
        ARRAY(
            SELECT u.email FROM mails_to mt
            JOIN users u ON u.id = mt.user_id
            WHERE mt.mail_id = m.id
            ORDER BY u.email
        ),
        ARRAY[]::text[]
    ) AS recipient_emails
FROM mails m
WHERE ($1::text IS NULL OR m.status = $1)
  AND ($2::text IS NULL OR m.mail_status = $2)
  AND ($3::uuid IS NULL OR m.id IN (
      SELECT mt2.mail_id FROM mails_to mt2
      WHERE mt2.user_id = $3
  ))
ORDER BY m.created_at DESC
"""


@router.get("/", response_model=List[MailWithRecipients])
@require_permission_decorator(PermissionEnum.ADMIN)
async def get_mails(
    status: Optional[str] = Query(default=None),
    mail_status: Optional[str] = Query(default=None),
    user_id: Optional[str] = Query(default=None),
    current_user: dict = Depends(get_current_user),
):
    pool = get_database()
    async with pool.acquire() as conn:
        rows = await conn.fetch(_QUERY, status or None, mail_status or None, user_id or None)

    return [
        MailWithRecipients(
            id=str(row["id"]),
            subject=row["subject"],
            content_html=row["content_html"],
            mail_type=row["mail_type"],
            mail_status=row["mail_status"],
            planned_at=row["planned_at"],
            sent_at=row["sent_at"],
            status=row["status"],
            created_at=row["created_at"],
            updated_at=row["updated_at"],
            created_by=row["created_by"],
            updated_by=row["updated_by"],
            recipient_emails=list(row["recipient_emails"]) if row["recipient_emails"] else [],
        )
        for row in rows
    ]
