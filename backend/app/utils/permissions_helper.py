from uuid import UUID
from typing import List
import asyncpg
from .db_helpers import row_to_dict


async def get_user_permissions(pool: asyncpg.Pool, user_id: str) -> List[str]:
    async with pool.acquire() as conn:
        rows = await conn.fetch(
            """SELECT DISTINCT p.name
               FROM users u
                        JOIN user_roles ur ON u.id = ur.user_id
                        JOIN role_permissions rp ON ur.role_id = rp.role_id
                        JOIN permissions p ON rp.permission_id = p.id
               WHERE u.id = $1""",
            UUID(user_id)
        )

    return [row['name'] for row in rows]