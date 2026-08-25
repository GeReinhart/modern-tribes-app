from datetime import date, datetime, timezone
from typing import Optional
from uuid import UUID


async def insert_meal(
    pool, feature_instance_id: str, title: str, start_at: datetime, end_at: datetime, headcount: int, user_id: str,
) -> dict:
    async with pool.acquire() as conn:
        row = await conn.fetchrow(
            """INSERT INTO meals (feature_instance_id, title, start_at, end_at, headcount, created_by, updated_by)
               VALUES ($1, $2, $3, $4, $5, $6, $6) RETURNING *""",
            UUID(feature_instance_id), title, start_at, end_at, headcount, UUID(user_id),
        )
    return dict(row)


async def fetch_meal(pool, meal_id: str) -> Optional[dict]:
    async with pool.acquire() as conn:
        row = await conn.fetchrow("SELECT * FROM meals WHERE id = $1", UUID(meal_id))
        if not row:
            return None
        participants_map = await _fetch_participants_map(conn, [row["id"]])
        recipe_ids_map = await _fetch_recipe_ids_map(conn, [row["id"]])
    return _enrich_row(dict(row), participants_map, recipe_ids_map)


async def fetch_meals_for_instance(pool, feature_instance_id: str) -> list[dict]:
    async with pool.acquire() as conn:
        rows = await conn.fetch(
            """SELECT * FROM meals WHERE feature_instance_id = $1 AND status = 'active' ORDER BY start_at ASC""",
            UUID(feature_instance_id),
        )
        meal_ids = [r["id"] for r in rows]
        participants_map = await _fetch_participants_map(conn, meal_ids)
        recipe_ids_map = await _fetch_recipe_ids_map(conn, meal_ids)
    return [_enrich_row(dict(r), participants_map, recipe_ids_map) for r in rows]


async def _fetch_participants_map(conn, meal_ids: list) -> dict:
    if not meal_ids:
        return {}
    rows = await conn.fetch(
        """SELECT mp.meal_id, mp.person_id, p.first_name || ' ' || p.last_name AS person_name
           FROM meal_participants mp
           JOIN persons p ON p.id = mp.person_id
           WHERE mp.meal_id = ANY($1) AND mp.status = 'active'""",
        meal_ids,
    )
    result: dict = {}
    for r in rows:
        mid = str(r["meal_id"])
        result.setdefault(mid, []).append({"person_id": str(r["person_id"]), "person_name": r["person_name"]})
    return result


async def _fetch_recipe_ids_map(conn, meal_ids: list) -> dict:
    if not meal_ids:
        return {}
    rows = await conn.fetch(
        "SELECT meal_id, recipe_id FROM meal_recipes WHERE meal_id = ANY($1)",
        meal_ids,
    )
    result: dict = {}
    for r in rows:
        mid = str(r["meal_id"])
        result.setdefault(mid, []).append(str(r["recipe_id"]))
    return result


def _enrich_row(row: dict, participants_map: dict, recipe_ids_map: dict) -> dict:
    mid = str(row["id"])
    participants = participants_map.get(mid, [])
    row["participants"] = participants
    row["participant_ids"] = [p["person_id"] for p in participants]
    row["recipe_ids"] = recipe_ids_map.get(mid, [])
    return row


async def update_meal_basic(pool, meal_id: str, updates: dict, user_id: str) -> None:
    if not updates:
        return
    fields = {"updated_by": UUID(user_id), **updates}
    set_clauses = ", ".join(f"{k} = ${i + 2}" for i, k in enumerate(fields.keys()))
    async with pool.acquire() as conn:
        await conn.execute(f"UPDATE meals SET {set_clauses} WHERE id = $1", UUID(meal_id), *fields.values())


async def delete_meal(pool, meal_id: str) -> None:
    async with pool.acquire() as conn:
        await conn.execute("DELETE FROM meals WHERE id = $1", UUID(meal_id))


async def set_participants(pool, meal_id: str, person_ids: list[str], user_id: str) -> None:
    mid = UUID(meal_id)
    uid = UUID(user_id)
    pids = [UUID(pid) for pid in person_ids]
    async with pool.acquire() as conn:
        await conn.execute(
            "UPDATE meal_participants SET status = 'archived', updated_by = $1 WHERE meal_id = $2",
            uid, mid,
        )
        for pid in pids:
            await conn.execute(
                """INSERT INTO meal_participants (meal_id, person_id, created_by, updated_by)
                   VALUES ($1, $2, $3, $3)
                   ON CONFLICT (meal_id, person_id) DO UPDATE
                   SET status = 'active', updated_by = $3, updated_at = NOW()""",
                mid, pid, uid,
            )


async def toggle_recipe(pool, meal_id: str, recipe_id: str) -> list[str]:
    mid = UUID(meal_id)
    rid = UUID(recipe_id)
    async with pool.acquire() as conn:
        existing = await conn.fetchval(
            "SELECT id FROM meal_recipes WHERE meal_id = $1 AND recipe_id = $2", mid, rid,
        )
        if existing:
            await conn.execute("DELETE FROM meal_recipes WHERE id = $1", existing)
        else:
            await conn.execute(
                "INSERT INTO meal_recipes (meal_id, recipe_id) VALUES ($1, $2)", mid, rid,
            )
        rows = await conn.fetch("SELECT recipe_id FROM meal_recipes WHERE meal_id = $1", mid)
    return [str(r["recipe_id"]) for r in rows]


async def fetch_groceries_list_scope(pool, groceries_list_id: str) -> Optional[dict]:
    async with pool.acquire() as conn:
        row = await conn.fetchrow(
            """SELECT gl.scheduled_date, gl.list_status, pf.project_id
               FROM groceries_lists gl
               JOIN projects_features pf ON pf.id = gl.feature_instance_id
               WHERE gl.id = $1 AND gl.status = 'active'""",
            UUID(groceries_list_id),
        )
    return dict(row) if row else None


async def fetch_grocery_suggestion_rows(pool, project_id: str, after_date: date) -> list[dict]:
    async with pool.acquire() as conn:
        rows = await conn.fetch(
            """SELECT m.id AS meal_id, m.title AS meal_title, m.start_at AS meal_start_at, m.headcount,
                      r.id AS recipe_id, r.name AS recipe_name, r.servings,
                      ri.position,
                      ri.groceries_item_id,
                      COALESCE(gi.name, ri.custom_name) AS ingredient_name,
                      COALESCE(gi.unit, ri.custom_unit) AS ingredient_unit,
                      COALESCE(gi.is_divisible, TRUE) AS is_divisible,
                      ri.quantity
               FROM meals m
               JOIN projects_features pf ON pf.id = m.feature_instance_id AND pf.status = 'active'
               JOIN meal_recipes mr ON mr.meal_id = m.id
               JOIN recipes r ON r.id = mr.recipe_id AND r.status = 'active'
               JOIN recipe_ingredients ri ON ri.recipe_id = r.id AND ri.status = 'active'
               LEFT JOIN groceries_items gi ON gi.id = ri.groceries_item_id
               WHERE pf.project_id = $1 AND m.status = 'active' AND m.start_at > $2::timestamptz
               ORDER BY m.start_at ASC, r.name ASC, ri.position ASC""",
            UUID(project_id), after_date,
        )
    return [dict(r) for r in rows]
