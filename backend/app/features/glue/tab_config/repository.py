import json
from uuid import UUID

from app.platform.core.utils.db_helpers import row_with_json_to_dict


async def get_tab_config(pool, user_id: str, context_key: str) -> dict | None:
    async with pool.acquire() as conn:
        row = await conn.fetchrow(
            "SELECT * FROM user_tab_configs "
            "WHERE user_id = $1::uuid AND context_key = $2 AND status = 'active'",
            UUID(user_id),
            context_key,
        )
    return row_with_json_to_dict(row) if row else None


async def upsert_tab_config(
    pool, user_id: str, context_key: str, tab_configs: list, current_user_id: str
) -> dict:
    async with pool.acquire() as conn:
        row = await conn.fetchrow(
            """
            INSERT INTO user_tab_configs (user_id, context_key, tab_configs, created_by, updated_by)
            VALUES ($1::uuid, $2, $3::jsonb, $4::uuid, $4::uuid)
            ON CONFLICT (user_id, context_key)
            DO UPDATE SET
                tab_configs = EXCLUDED.tab_configs,
                updated_by  = EXCLUDED.updated_by,
                updated_at  = NOW()
            RETURNING *
            """,
            UUID(user_id),
            context_key,
            json.dumps(tab_configs),
            UUID(current_user_id),
        )
    return row_with_json_to_dict(row)
