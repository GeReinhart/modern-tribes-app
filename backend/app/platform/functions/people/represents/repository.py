from typing import Any, Dict, Optional
from uuid import UUID

import asyncpg

from app.platform.core.utils.db_helpers import row_to_dict


async def find_represents_pair(
    pool: asyncpg.Pool, user_id: str, person_id: str
) -> Optional[Dict[str, Any]]:
    """Find an existing represents link for a (user_id, person_id) pair, regardless of status"""
    async with pool.acquire() as conn:
        row = await conn.fetchrow(
            "SELECT * FROM represents WHERE user_id = $1 AND person_id = $2",
            UUID(user_id),
            UUID(person_id),
        )
    return row_to_dict(row) if row else None


async def reactivate_represents(
    pool: asyncpg.Pool, represents_id: str, updated_by: str
) -> Dict[str, Any]:
    """Reactivate an archived represents link"""
    async with pool.acquire() as conn:
        row = await conn.fetchrow(
            """UPDATE represents SET status = 'active', updated_by = $2
               WHERE id = $1 RETURNING *""",
            UUID(represents_id),
            UUID(updated_by),
        )
    return row_to_dict(row)
