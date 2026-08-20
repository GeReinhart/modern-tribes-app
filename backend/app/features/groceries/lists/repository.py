from datetime import date, datetime, timezone
from typing import Optional
from uuid import UUID


async def insert_list(
    pool, feature_instance_id: str, name: Optional[str], scheduled_date: date,
    assigned_person_id: Optional[str], force_on_dashboard: bool, user_id: str,
) -> dict:
    async with pool.acquire() as conn:
        row = await conn.fetchrow(
            """INSERT INTO groceries_lists
                   (feature_instance_id, name, scheduled_date, assigned_person_id, force_on_dashboard, created_by, updated_by)
               VALUES ($1, $2, $3, $4, $5, $6, $6) RETURNING *""",
            UUID(feature_instance_id),
            name,
            scheduled_date,
            UUID(assigned_person_id) if assigned_person_id else None,
            force_on_dashboard,
            UUID(user_id),
        )
    return dict(row)


async def fetch_list(pool, list_id: str) -> Optional[dict]:
    async with pool.acquire() as conn:
        row = await conn.fetchrow("SELECT * FROM groceries_lists WHERE id = $1", UUID(list_id))
    return dict(row) if row else None


async def fetch_lists_for_instance(pool, feature_instance_id: str) -> list[dict]:
    async with pool.acquire() as conn:
        rows = await conn.fetch(
            """SELECT * FROM groceries_lists
               WHERE feature_instance_id = $1
               ORDER BY scheduled_date ASC, created_at ASC""",
            UUID(feature_instance_id),
        )
    return [dict(r) for r in rows]


async def fetch_list_items_detail(pool, list_id: str) -> list[dict]:
    async with pool.acquire() as conn:
        rows = await conn.fetch(
            """SELECT gli.id, gli.groceries_item_id, gi.name, gi.unit, gi.icon, gi.is_divisible,
                      gli.quantity, gli.picked_up,
                      ARRAY(
                          SELECT gis.groceries_section_id::text
                          FROM groceries_item_sections gis
                          WHERE gis.groceries_item_id = gi.id
                      ) AS section_ids
               FROM groceries_list_items gli
               JOIN groceries_items gi ON gi.id = gli.groceries_item_id
               WHERE gli.groceries_list_id = $1
               ORDER BY gli.position ASC""",
            UUID(list_id),
        )
    return [dict(r) for r in rows]


async def insert_list_item(pool, list_id: str, item_id: str, quantity: float, user_id: str) -> dict:
    async with pool.acquire() as conn:
        position = await conn.fetchval(
            "SELECT COALESCE(MAX(position), -1) + 1 FROM groceries_list_items WHERE groceries_list_id = $1",
            UUID(list_id),
        )
        row = await conn.fetchrow(
            """INSERT INTO groceries_list_items
                   (groceries_list_id, groceries_item_id, quantity, position, created_by, updated_by)
               VALUES ($1, $2, $3, $4, $5, $5) RETURNING *""",
            UUID(list_id), UUID(item_id), quantity, position, UUID(user_id),
        )
    return dict(row)


async def fetch_list_item(pool, list_item_id: str) -> Optional[dict]:
    async with pool.acquire() as conn:
        row = await conn.fetchrow("SELECT * FROM groceries_list_items WHERE id = $1", UUID(list_item_id))
    return dict(row) if row else None


async def update_list_item(
    pool, list_item_id: str, quantity: Optional[float], picked_up: Optional[bool], user_id: str
) -> dict:
    fields: dict = {"updated_by": UUID(user_id)}
    if quantity is not None:
        fields["quantity"] = quantity
    if picked_up is not None:
        fields["picked_up"] = picked_up
        fields["picked_up_at"] = datetime.now(timezone.utc) if picked_up else None
    set_clauses = ", ".join(f"{k} = ${i + 2}" for i, k in enumerate(fields.keys()))
    async with pool.acquire() as conn:
        row = await conn.fetchrow(
            f"UPDATE groceries_list_items SET {set_clauses} WHERE id = $1 RETURNING *",
            UUID(list_item_id),
            *fields.values(),
        )
    return dict(row)


async def delete_list_item(pool, list_item_id: str) -> None:
    async with pool.acquire() as conn:
        await conn.execute("DELETE FROM groceries_list_items WHERE id = $1", UUID(list_item_id))


async def fetch_suggestions(pool, feature_instance_id: str) -> list[dict]:
    async with pool.acquire() as conn:
        rows = await conn.fetch(
            """SELECT gi.id AS groceries_item_id, gi.name, gi.unit, gi.icon, gii.renewal_duration_days
               FROM groceries_instance_items gii
               JOIN groceries_items gi ON gi.id = gii.groceries_item_id
               LEFT JOIN LATERAL (
                   SELECT MAX(gli.picked_up_at) AS last_picked_up_at
                   FROM groceries_list_items gli
                   JOIN groceries_lists gl ON gl.id = gli.groceries_list_id
                   WHERE gl.feature_instance_id = gii.feature_instance_id
                     AND gli.groceries_item_id = gii.groceries_item_id
                     AND gli.picked_up = TRUE
               ) last_pick ON TRUE
               WHERE gii.feature_instance_id = $1
                 AND gii.status = 'active'
                 AND (
                     last_pick.last_picked_up_at IS NULL
                     OR last_pick.last_picked_up_at + (gii.renewal_duration_days || ' days')::interval <= NOW()
                 )
               ORDER BY gi.name ASC""",
            UUID(feature_instance_id),
        )
    return [dict(r) for r in rows]
