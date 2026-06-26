from uuid import UUID


async def upsert_subscription(
    pool, user_id: str, endpoint: str, p256dh: str, auth: str
) -> dict:
    async with pool.acquire() as conn:
        row = await conn.fetchrow(
            """
            INSERT INTO push_subscriptions (user_id, endpoint, p256dh, auth, created_by, updated_by)
            VALUES ($1, $2, $3, $4, $1, $1)
            ON CONFLICT (user_id, endpoint) DO UPDATE
                SET p256dh = EXCLUDED.p256dh,
                    auth = EXCLUDED.auth,
                    status = 'active',
                    updated_by = EXCLUDED.updated_by
            RETURNING id, user_id, endpoint, p256dh, auth, status, created_at
            """,
            UUID(user_id), endpoint, p256dh, auth,
        )
        return dict(row)


async def delete_subscription(pool, user_id: str, endpoint: str) -> bool:
    async with pool.acquire() as conn:
        result = await conn.execute(
            "DELETE FROM push_subscriptions WHERE user_id = $1 AND endpoint = $2",
            UUID(user_id), endpoint,
        )
        return result.split()[-1] != "0"


async def list_for_user(pool, user_id: str) -> list[dict]:
    async with pool.acquire() as conn:
        rows = await conn.fetch(
            """
            SELECT id, user_id, endpoint, p256dh, auth
            FROM push_subscriptions
            WHERE user_id = $1 AND status = 'active'
            """,
            UUID(user_id),
        )
        return [dict(r) for r in rows]


async def delete_by_endpoint(pool, endpoint: str) -> None:
    async with pool.acquire() as conn:
        await conn.execute(
            "DELETE FROM push_subscriptions WHERE endpoint = $1", endpoint
        )
