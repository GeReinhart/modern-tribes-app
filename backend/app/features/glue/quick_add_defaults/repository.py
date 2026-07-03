from uuid import UUID


async def get_configured_instance(pool, user_id: str, quick_add_type: str) -> str | None:
    async with pool.acquire() as conn:
        row = await conn.fetchrow(
            "SELECT feature_instance_id::text FROM user_quick_add_defaults "
            "WHERE user_id = $1::uuid AND quick_add_type = $2 AND status = 'active'",
            UUID(user_id),
            quick_add_type,
        )
    return row["feature_instance_id"] if row else None


async def upsert_configured_instance(
    pool, user_id: str, quick_add_type: str, feature_instance_id: str | None, current_user_id: str
) -> None:
    async with pool.acquire() as conn:
        await conn.execute(
            """
            INSERT INTO user_quick_add_defaults (user_id, quick_add_type, feature_instance_id, created_by, updated_by)
            VALUES ($1::uuid, $2, $3::uuid, $4::uuid, $4::uuid)
            ON CONFLICT (user_id, quick_add_type)
            DO UPDATE SET
                feature_instance_id = EXCLUDED.feature_instance_id,
                updated_by = EXCLUDED.updated_by,
                updated_at = NOW()
            """,
            UUID(user_id),
            quick_add_type,
            UUID(feature_instance_id) if feature_instance_id else None,
            UUID(current_user_id),
        )


async def get_feature_instance(pool, feature_instance_id: str) -> dict | None:
    async with pool.acquire() as conn:
        row = await conn.fetchrow(
            "SELECT id::text, feature_type, status FROM projects_features WHERE id = $1::uuid",
            UUID(feature_instance_id),
        )
    return dict(row) if row else None
