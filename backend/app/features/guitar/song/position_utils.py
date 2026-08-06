from uuid import UUID


async def fetch_ids_sorted_by_position(pool, table: str, parent_column: str, parent_id: str) -> list[dict]:
    """List a table's active rows for a parent, ordered by position. `table`/`parent_column` are internal
    constants, never user input."""
    async with pool.acquire() as conn:
        rows = await conn.fetch(
            f"SELECT id::text, position FROM {table} WHERE {parent_column} = $1 AND status = 'active' "
            "ORDER BY position ASC",
            UUID(parent_id),
        )
    return [dict(row) for row in rows]


async def swap_positions(pool, table: str, id_a: str, id_b: str, user_id: str) -> None:
    async with pool.acquire() as conn:
        pos_a = await conn.fetchval(f"SELECT position FROM {table} WHERE id = $1", UUID(id_a))
        pos_b = await conn.fetchval(f"SELECT position FROM {table} WHERE id = $1", UUID(id_b))
        await conn.execute(
            f"UPDATE {table} SET position = $1, updated_by = $2::uuid WHERE id = $3",
            pos_b, UUID(user_id), UUID(id_a),
        )
        await conn.execute(
            f"UPDATE {table} SET position = $1, updated_by = $2::uuid WHERE id = $3",
            pos_a, UUID(user_id), UUID(id_b),
        )


def find_move_target_id(ordered: list[dict], item_id: str, direction: str) -> str | None:
    idx = next((i for i, row in enumerate(ordered) if row["id"] == item_id), None)
    if idx is None:
        return None
    target_idx = idx - 1 if direction == "prev" else idx + 1
    if 0 <= target_idx < len(ordered):
        return ordered[target_idx]["id"]
    return None
