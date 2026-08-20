from typing import Optional
from uuid import UUID


async def insert_item(
    pool, name: str, description: str, unit: str, icon: Optional[str], is_divisible: bool, user_id: str,
) -> dict:
    async with pool.acquire() as conn:
        row = await conn.fetchrow(
            """INSERT INTO groceries_items (name, description, unit, icon, is_divisible, created_by, updated_by)
               VALUES ($1, $2, $3, $4, $5, $6, $6) RETURNING *""",
            name, description, unit, icon, is_divisible, UUID(user_id),
        )
    return dict(row)


async def insert_section(pool, name: str, icon: Optional[str], user_id: str) -> dict:
    async with pool.acquire() as conn:
        row = await conn.fetchrow(
            """INSERT INTO groceries_sections (name, icon, created_by, updated_by)
               VALUES ($1, $2, $3, $3) RETURNING *""",
            name, icon, UUID(user_id),
        )
    return dict(row)


async def fetch_item(pool, item_id: str) -> Optional[dict]:
    async with pool.acquire() as conn:
        row = await conn.fetchrow("SELECT * FROM groceries_items WHERE id = $1", UUID(item_id))
    return dict(row) if row else None


async def fetch_item_with_sections(pool, item_id: str, feature_instance_id: str) -> Optional[dict]:
    async with pool.acquire() as conn:
        row = await conn.fetchrow(
            """SELECT gi.*, ARRAY(
                   SELECT gis.groceries_section_id::text
                   FROM groceries_item_sections gis
                   WHERE gis.groceries_item_id = gi.id
               ) AS section_ids,
               gii.renewal_duration_days
               FROM groceries_items gi
               LEFT JOIN groceries_instance_items gii
                   ON gii.groceries_item_id = gi.id AND gii.feature_instance_id = $2 AND gii.status = 'active'
               WHERE gi.id = $1""",
            UUID(item_id),
            UUID(feature_instance_id),
        )
    return dict(row) if row else None


async def update_item(
    pool,
    item_id: str,
    name: Optional[str],
    description: Optional[str],
    unit: Optional[str],
    icon: Optional[str],
    is_divisible: Optional[bool],
    status: Optional[str],
    user_id: str,
) -> None:
    fields: dict = {"updated_by": UUID(user_id)}
    if name is not None:
        fields["name"] = name
    if description is not None:
        fields["description"] = description
    if unit is not None:
        fields["unit"] = unit
    if icon is not None:
        fields["icon"] = icon
    if is_divisible is not None:
        fields["is_divisible"] = is_divisible
    if status is not None:
        fields["status"] = status
    set_clauses = ", ".join(f"{k} = ${i + 2}" for i, k in enumerate(fields.keys()))
    async with pool.acquire() as conn:
        await conn.execute(
            f"UPDATE groceries_items SET {set_clauses} WHERE id = $1",
            UUID(item_id),
            *fields.values(),
        )


async def fetch_items(pool, feature_instance_id: str) -> list[dict]:
    async with pool.acquire() as conn:
        rows = await conn.fetch(
            """SELECT gi.*, ARRAY(
                   SELECT gis.groceries_section_id::text
                   FROM groceries_item_sections gis
                   WHERE gis.groceries_item_id = gi.id
               ) AS section_ids,
               gii.renewal_duration_days
               FROM groceries_items gi
               LEFT JOIN groceries_instance_items gii
                   ON gii.groceries_item_id = gi.id AND gii.feature_instance_id = $1 AND gii.status = 'active'
               WHERE gi.status = 'active'
               ORDER BY gi.name ASC""",
            UUID(feature_instance_id),
        )
    return [dict(r) for r in rows]


async def upsert_instance_item(pool, feature_instance_id: str, item_id: str, renewal_duration_days: int, user_id: str) -> None:
    async with pool.acquire() as conn:
        await conn.execute(
            """INSERT INTO groceries_instance_items
                   (feature_instance_id, groceries_item_id, renewal_duration_days, created_by, updated_by)
               VALUES ($1, $2, $3, $4, $4)
               ON CONFLICT (feature_instance_id, groceries_item_id)
               DO UPDATE SET renewal_duration_days = $3, updated_by = $4, updated_at = CURRENT_TIMESTAMP, status = 'active'""",
            UUID(feature_instance_id), UUID(item_id), renewal_duration_days, UUID(user_id),
        )


async def delete_instance_item(pool, feature_instance_id: str, item_id: str) -> None:
    async with pool.acquire() as conn:
        await conn.execute(
            "DELETE FROM groceries_instance_items WHERE feature_instance_id = $1 AND groceries_item_id = $2",
            UUID(feature_instance_id), UUID(item_id),
        )


async def fetch_sections(pool) -> list[dict]:
    async with pool.acquire() as conn:
        rows = await conn.fetch("SELECT * FROM groceries_sections WHERE status = 'active' ORDER BY name ASC")
    return [dict(r) for r in rows]


async def fetch_section(pool, section_id: str) -> Optional[dict]:
    async with pool.acquire() as conn:
        row = await conn.fetchrow("SELECT * FROM groceries_sections WHERE id = $1", UUID(section_id))
    return dict(row) if row else None


async def update_section(pool, section_id: str, name: Optional[str], icon: Optional[str], user_id: str) -> dict:
    fields: dict = {"updated_by": UUID(user_id)}
    if name is not None:
        fields["name"] = name
    if icon is not None:
        fields["icon"] = icon
    set_clauses = ", ".join(f"{k} = ${i + 2}" for i, k in enumerate(fields.keys()))
    async with pool.acquire() as conn:
        row = await conn.fetchrow(
            f"UPDATE groceries_sections SET {set_clauses} WHERE id = $1 RETURNING *",
            UUID(section_id),
            *fields.values(),
        )
    return dict(row)


async def count_section_items(pool, section_id: str) -> int:
    async with pool.acquire() as conn:
        count = await conn.fetchval(
            "SELECT COUNT(*) FROM groceries_item_sections WHERE groceries_section_id = $1", UUID(section_id),
        )
    return int(count)


async def delete_section(pool, section_id: str) -> None:
    async with pool.acquire() as conn:
        await conn.execute("DELETE FROM groceries_sections WHERE id = $1", UUID(section_id))


async def toggle_item_section(pool, item_id: str, section_id: str) -> list[str]:
    iid, sid = UUID(item_id), UUID(section_id)
    async with pool.acquire() as conn:
        existing = await conn.fetchval(
            "SELECT 1 FROM groceries_item_sections WHERE groceries_item_id = $1 AND groceries_section_id = $2",
            iid, sid,
        )
        if existing:
            await conn.execute(
                "DELETE FROM groceries_item_sections WHERE groceries_item_id = $1 AND groceries_section_id = $2",
                iid, sid,
            )
        else:
            await conn.execute(
                "INSERT INTO groceries_item_sections (groceries_item_id, groceries_section_id) VALUES ($1, $2)",
                iid, sid,
            )
        rows = await conn.fetch(
            "SELECT groceries_section_id FROM groceries_item_sections WHERE groceries_item_id = $1", iid,
        )
    return [str(r["groceries_section_id"]) for r in rows]
