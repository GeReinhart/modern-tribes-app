from datetime import datetime, timezone
from uuid import UUID


async def insert_notification(
    pool, target_user_id: str, message: str, current_user_id: str, url_param_id: str
) -> dict:
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
            UUID(current_user_id),
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
