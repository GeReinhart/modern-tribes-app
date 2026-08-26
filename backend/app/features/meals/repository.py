from datetime import date, datetime, timezone
from typing import Optional
from uuid import UUID

from app.platform.core.utils.document_helpers import strip_html, extract_content_summary

_DOCUMENT_SQL = "d.content_html AS document_content_html"


async def insert_meal(
    pool, feature_instance_id: str, title: Optional[str], start_at: datetime, end_at: datetime, headcount: int,
    user_id: str,
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
        row = await conn.fetchrow(
            f"""SELECT m.*, {_DOCUMENT_SQL} FROM meals m
               LEFT JOIN documents d ON d.id = m.document_id
               WHERE m.id = $1""",
            UUID(meal_id),
        )
        if not row:
            return None
        participants_map = await _fetch_participants_map(conn, [row["id"]])
        recipe_ids_map = await _fetch_recipe_ids_map(conn, [row["id"]])
    return _enrich_row(dict(row), participants_map, recipe_ids_map)


async def fetch_meals_for_instance(pool, feature_instance_id: str) -> list[dict]:
    async with pool.acquire() as conn:
        rows = await conn.fetch(
            f"""SELECT m.*, {_DOCUMENT_SQL} FROM meals m
               LEFT JOIN documents d ON d.id = m.document_id
               WHERE m.feature_instance_id = $1 AND m.status = 'active' ORDER BY m.start_at ASC""",
            UUID(feature_instance_id),
        )
        meal_ids = [r["id"] for r in rows]
        participants_map = await _fetch_participants_map(conn, meal_ids)
        recipe_ids_map = await _fetch_recipe_ids_map(conn, meal_ids)
    return [_enrich_row(dict(r), participants_map, recipe_ids_map) for r in rows]


async def upsert_document(pool, meal_id: str, content_html: str, user_id: str) -> None:
    uid = UUID(user_id)
    mid = UUID(meal_id)
    content_text = strip_html(content_html)
    content_summary = extract_content_summary(content_html)
    now = datetime.now(timezone.utc)
    async with pool.acquire() as conn:
        doc_id = await conn.fetchval("SELECT document_id FROM meals WHERE id = $1", mid)
        if doc_id is None:
            new_doc_id = await conn.fetchval(
                """INSERT INTO documents (content_html, content_text, content_summary, created_by, updated_by)
                   VALUES ($1, $2, $3, $4, $4) RETURNING id""",
                content_html, content_text, content_summary, uid,
            )
            await conn.execute("UPDATE meals SET document_id = $1 WHERE id = $2", new_doc_id, mid)
        else:
            await conn.execute(
                """UPDATE documents SET content_html=$1, content_text=$2, content_summary=$3,
                   updated_at=$4, updated_by=$5 WHERE id=$6""",
                content_html, content_text, content_summary, now, uid, doc_id,
            )


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
                      ri.id AS recipe_ingredient_id,
                      ri.position,
                      ri.groceries_item_id,
                      COALESCE(gi.name, ri.custom_name) AS ingredient_name,
                      COALESCE(gi.unit, ri.custom_unit) AS ingredient_unit,
                      COALESCE(gi.is_divisible, TRUE) AS is_divisible,
                      ri.quantity, ri.is_accompaniment
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


async def fetch_added_meal_ids(pool, groceries_list_id: str) -> set:
    async with pool.acquire() as conn:
        rows = await conn.fetch(
            "SELECT meal_id FROM groceries_list_meals WHERE groceries_list_id = $1 AND status = 'active'",
            UUID(groceries_list_id),
        )
    return {str(r["meal_id"]) for r in rows}


async def fetch_meal_ingredient_rows(pool, meal_id: str) -> list[dict]:
    """Core ingredients only — accompaniments are added to a groceries list one at a time,
    not swept in by the bulk "add all" action."""
    async with pool.acquire() as conn:
        rows = await conn.fetch(
            """SELECT r.servings, ri.groceries_item_id, ri.custom_name, ri.custom_unit, ri.quantity,
                      COALESCE(gi.is_divisible, TRUE) AS is_divisible
               FROM meal_recipes mr
               JOIN recipes r ON r.id = mr.recipe_id AND r.status = 'active'
               JOIN recipe_ingredients ri ON ri.recipe_id = r.id AND ri.status = 'active'
               LEFT JOIN groceries_items gi ON gi.id = ri.groceries_item_id
               WHERE mr.meal_id = $1 AND ri.is_accompaniment = FALSE""",
            UUID(meal_id),
        )
    return [dict(r) for r in rows]


async def fetch_single_recipe_ingredient_for_meal(pool, meal_id: str, recipe_ingredient_id: str) -> Optional[dict]:
    async with pool.acquire() as conn:
        row = await conn.fetchrow(
            """SELECT r.servings, ri.groceries_item_id, ri.custom_name, ri.custom_unit, ri.quantity,
                      COALESCE(gi.is_divisible, TRUE) AS is_divisible
               FROM meal_recipes mr
               JOIN recipes r ON r.id = mr.recipe_id AND r.status = 'active'
               JOIN recipe_ingredients ri ON ri.recipe_id = r.id AND ri.status = 'active'
               LEFT JOIN groceries_items gi ON gi.id = ri.groceries_item_id
               WHERE mr.meal_id = $1 AND ri.id = $2""",
            UUID(meal_id), UUID(recipe_ingredient_id),
        )
    return dict(row) if row else None


async def fetch_added_meals_detail(pool, groceries_list_id: str) -> list[dict]:
    async with pool.acquire() as conn:
        rows = await conn.fetch(
            """SELECT glm.meal_id, glm.headcount, m.title AS meal_title, m.start_at AS meal_start_at,
                      ARRAY(
                          SELECT r.name
                          FROM meal_recipes mr
                          JOIN recipes r ON r.id = mr.recipe_id AND r.status = 'active'
                          WHERE mr.meal_id = m.id
                          ORDER BY r.name ASC
                      ) AS recipe_names
               FROM groceries_list_meals glm
               JOIN meals m ON m.id = glm.meal_id AND m.status = 'active'
               WHERE glm.groceries_list_id = $1 AND glm.status = 'active'
               ORDER BY m.start_at ASC""",
            UUID(groceries_list_id),
        )
    return [dict(r) for r in rows]


async def mark_meal_added(pool, groceries_list_id: str, meal_id: str, headcount: int, user_id: str) -> None:
    async with pool.acquire() as conn:
        await conn.execute(
            """INSERT INTO groceries_list_meals (groceries_list_id, meal_id, headcount, created_by, updated_by)
               VALUES ($1, $2, $3, $4, $4)
               ON CONFLICT (groceries_list_id, meal_id)
               DO UPDATE SET status = 'active', headcount = $3, updated_by = $4, updated_at = CURRENT_TIMESTAMP""",
            UUID(groceries_list_id), UUID(meal_id), headcount, UUID(user_id),
        )


async def unmark_meal_added(pool, groceries_list_id: str, meal_id: str, user_id: str) -> None:
    async with pool.acquire() as conn:
        await conn.execute(
            """UPDATE groceries_list_meals SET status = 'archived', updated_by = $3, updated_at = CURRENT_TIMESTAMP
               WHERE groceries_list_id = $1 AND meal_id = $2 AND status = 'active'""",
            UUID(groceries_list_id), UUID(meal_id), UUID(user_id),
        )


async def _find_matching_list_item(conn, groceries_list_id: str, item: dict) -> Optional[dict]:
    groceries_item_id = UUID(item["groceries_item_id"]) if item.get("groceries_item_id") else None
    return await conn.fetchrow(
        """SELECT id, quantity FROM groceries_list_items
           WHERE groceries_list_id = $1
             AND (
                 (groceries_item_id IS NOT NULL AND groceries_item_id = $2)
                 OR (
                     $2 IS NULL AND groceries_item_id IS NULL
                     AND lower(custom_name) = lower($3)
                     AND lower(COALESCE(custom_unit, '')) = lower(COALESCE($4, ''))
                 )
             )
           LIMIT 1""",
        UUID(groceries_list_id), groceries_item_id, item.get("custom_name"), item.get("custom_unit"),
    )


async def insert_list_items_bulk(pool, groceries_list_id: str, items: list[dict], user_id: str) -> None:
    async with pool.acquire() as conn:
        position = await conn.fetchval(
            "SELECT COALESCE(MAX(position), -1) + 1 FROM groceries_list_items WHERE groceries_list_id = $1",
            UUID(groceries_list_id),
        )
        offset = 0
        for item in items:
            existing = await _find_matching_list_item(conn, groceries_list_id, item)
            if existing:
                await conn.execute(
                    "UPDATE groceries_list_items SET quantity = quantity + $2, updated_by = $3 WHERE id = $1",
                    existing["id"], item["quantity"], UUID(user_id),
                )
                continue
            await conn.execute(
                """INSERT INTO groceries_list_items
                       (groceries_list_id, groceries_item_id, custom_name, custom_unit, quantity, position,
                        created_by, updated_by)
                   VALUES ($1, $2, $3, $4, $5, $6, $7, $7)""",
                UUID(groceries_list_id),
                UUID(item["groceries_item_id"]) if item.get("groceries_item_id") else None,
                item.get("custom_name"), item.get("custom_unit"), item["quantity"], position + offset,
                UUID(user_id),
            )
            offset += 1
