from datetime import datetime, timezone
from uuid import UUID

from ..utils.db_helpers import row_to_dict


async def get_user_by_email(pool, email: str) -> dict | None:
    async with pool.acquire() as conn:
        row = await conn.fetchrow("SELECT * FROM users WHERE email = $1", email)
    return row_to_dict(row) if row else None


async def get_user_by_id(pool, user_id: str) -> dict | None:
    async with pool.acquire() as conn:
        row = await conn.fetchrow("SELECT * FROM users WHERE id = $1", UUID(user_id))
    return row_to_dict(row) if row else None


async def get_user_roles(pool, user_id: str) -> list[str]:
    async with pool.acquire() as conn:
        rows = await conn.fetch(
            """SELECT r.name FROM roles r
               JOIN user_roles ur ON r.id = ur.role_id
               WHERE ur.user_id = $1""",
            UUID(user_id)
        )
    return [row['name'] for row in rows] if rows else ["user"]


async def create_session(
    pool, user_id: str, session_id: str,
    user_agent: str | None, ip_address: str | None,
    expires_at: datetime
) -> None:
    now = datetime.now(timezone.utc)
    async with pool.acquire() as conn:
        await conn.execute(
            """INSERT INTO user_sessions
               (user_id, session_id, user_agent, ip_address, expires_at, last_activity, created_at)
               VALUES ($1, $2, $3, $4, $5, $6, $7)""",
            UUID(user_id), session_id, user_agent, ip_address, expires_at, now, now
        )


async def get_session(pool, user_id: str, session_id: str) -> dict | None:
    async with pool.acquire() as conn:
        row = await conn.fetchrow(
            "SELECT * FROM user_sessions WHERE user_id = $1 AND session_id = $2",
            UUID(user_id), session_id
        )
    return row_to_dict(row) if row else None


async def update_session_activity(pool, user_id: str, session_id: str) -> None:
    async with pool.acquire() as conn:
        await conn.execute(
            "UPDATE user_sessions SET last_activity = $1 WHERE user_id = $2 AND session_id = $3",
            datetime.now(timezone.utc), UUID(user_id), session_id
        )


async def delete_session(pool, user_id: str, session_id: str) -> None:
    async with pool.acquire() as conn:
        await conn.execute(
            "DELETE FROM user_sessions WHERE user_id = $1 AND session_id = $2",
            UUID(user_id), session_id
        )


async def cleanup_old_sessions(pool, user_id: str, max_sessions: int = 5) -> None:
    async with pool.acquire() as conn:
        sessions = await conn.fetch(
            "SELECT id FROM user_sessions WHERE user_id = $1 ORDER BY last_activity DESC",
            UUID(user_id)
        )
        if not sessions or len(sessions) <= max_sessions:
            return
        ids_to_keep = [s['id'] for s in sessions[:max_sessions]]
        await conn.execute(
            "DELETE FROM user_sessions WHERE user_id = $1 AND id != ALL($2)",
            UUID(user_id), ids_to_keep
        )


async def get_active_sessions(pool, user_id: str) -> list[dict]:
    async with pool.acquire() as conn:
        rows = await conn.fetch(
            """SELECT * FROM user_sessions
               WHERE user_id = $1 AND expires_at > $2
               ORDER BY last_activity DESC""",
            UUID(user_id), datetime.now(timezone.utc)
        )
    return [row_to_dict(row) for row in rows]
