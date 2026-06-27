from datetime import datetime, timezone
from typing import Optional
from uuid import UUID


async def insert_notification(
    pool, target_user_id: str, message: str, current_user_id: Optional[str], url_param_id: str
) -> dict:
    author = UUID(current_user_id) if current_user_id else None
    async with pool.acquire() as conn:
        row = await conn.fetchrow(
            """
            INSERT INTO notifications
                (url_param_id, target_user_id, message, notification_status, created_by, updated_by)
            VALUES ($1, $2, $3, 'planned', $4, $4)
            RETURNING id, url_param_id, target_user_id, message, sent_at,
                      notification_status, created_at
            """,
            url_param_id,
            UUID(target_user_id),
            message,
            author,
        )
        return dict(row)


async def list_pending_for_user(pool, user_id: str) -> list[dict]:
    async with pool.acquire() as conn:
        rows = await conn.fetch(
            """
            SELECT id, url_param_id, target_user_id, message, sent_at,
                   notification_status, created_at
            FROM notifications
            WHERE target_user_id = $1
              AND notification_status = 'planned'
              AND status = 'active'
            ORDER BY created_at ASC
            """,
            UUID(user_id),
        )
        return [dict(r) for r in rows]


async def list_all_for_admin(pool) -> list[dict]:
    async with pool.acquire() as conn:
        rows = await conn.fetch(
            """
            SELECT n.id, n.url_param_id, n.target_user_id, n.message, n.sent_at,
                   n.notification_status, n.created_at, u.email AS target_user_email
            FROM notifications n
            JOIN users u ON u.id = n.target_user_id
            WHERE n.status = 'active'
            ORDER BY n.created_at DESC
            LIMIT 100
            """
        )
        return [dict(r) for r in rows]


async def archive_old_notifications(pool, retention_days: int) -> int:
    async with pool.acquire() as conn:
        result = await conn.execute(
            """
            UPDATE notifications
            SET status = 'archived'
            WHERE status = 'active'
              AND notification_status IN ('sent', 'failed')
              AND created_at < NOW() - ($1 || ' days')::INTERVAL
            """,
            str(retention_days),
        )
        return int(result.split()[-1])


async def mark_push_received(pool, url_param_id: str) -> dict:
    sent_at = datetime.now(timezone.utc)
    async with pool.acquire() as conn:
        row = await conn.fetchrow(
            """
            UPDATE notifications
            SET notification_status = 'sent',
                sent_at = COALESCE(sent_at, $1)
            WHERE url_param_id = $2
              AND notification_status = 'planned'
              AND status = 'active'
            RETURNING id, url_param_id, target_user_id, message, sent_at,
                      notification_status, created_at
            """,
            sent_at,
            url_param_id,
        )
        return dict(row) if row else None


async def update_notification_status(
    pool, notification_id: str, target_user_id: str, new_status: str
) -> dict:
    sent_at = datetime.now(timezone.utc) if new_status == "sent" else None
    async with pool.acquire() as conn:
        row = await conn.fetchrow(
            """
            UPDATE notifications
            SET notification_status = $1,
                sent_at = COALESCE($2, sent_at)
            WHERE id = $3
              AND target_user_id = $4
              AND status = 'active'
            RETURNING id, url_param_id, target_user_id, message, sent_at,
                      notification_status, created_at
            """,
            new_status,
            sent_at,
            UUID(notification_id),
            UUID(target_user_id),
        )
        return dict(row) if row else None
