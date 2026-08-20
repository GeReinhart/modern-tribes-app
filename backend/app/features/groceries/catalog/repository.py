from typing import Optional
from uuid import UUID


async def insert_item(pool, name: str, description: str, unit: str, user_id: str) -> dict:
    async with pool.acquire() as conn:
        row = await conn.fetchrow(
            """INSERT INTO groceries_items (name, description, unit, created_by, updated_by)
               VALUES ($1, $2, $3, $4, $4) RETURNING *""",
            name, description, unit, UUID(user_id),
        )
    return dict(row)


async def insert_section(pool, name: str, user_id: str) -> dict:
    async with pool.acquire() as conn:
        row = await conn.fetchrow(
            """INSERT INTO groceries_sections (name, created_by, updated_by)
               VALUES ($1, $2, $2) RETURNING *""",
            name, UUID(user_id),
        )
    return dict(row)


async def fetch_item(pool, item_id: str) -> Optional[dict]:
    async with pool.acquire() as conn:
        row = await conn.fetchrow("SELECT * FROM groceries_items WHERE id = $1", UUID(item_id))
    return dict(row) if row else None
