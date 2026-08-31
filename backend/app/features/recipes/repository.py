from datetime import datetime, timezone
from typing import Optional
from uuid import UUID

from app.platform.core.utils.document_helpers import strip_html, extract_content_summary

_LABEL_IDS_SQL = """ARRAY(
                          SELECT le.label_id::text FROM label_entities le
                          WHERE le.entity_type = 'recipe' AND le.entity_id = r.id
                      ) AS label_ids"""


async def insert_recipe(pool, feature_instance_id: str, name: str, servings: int, user_id: str) -> dict:
    async with pool.acquire() as conn:
        row = await conn.fetchrow(
            """INSERT INTO recipes (feature_instance_id, name, servings, created_by, updated_by)
               VALUES ($1, $2, $3, $4, $4) RETURNING *""",
            UUID(feature_instance_id), name, servings, UUID(user_id),
        )
    return dict(row)


async def fetch_recipe(pool, recipe_id: str) -> Optional[dict]:
    async with pool.acquire() as conn:
        row = await conn.fetchrow(
            f"""SELECT r.*, d.content_html AS document_content_html, {_LABEL_IDS_SQL}
               FROM recipes r
               LEFT JOIN documents d ON d.id = r.document_id
               WHERE r.id = $1""",
            UUID(recipe_id),
        )
    return dict(row) if row else None


async def fetch_recipes_for_instance(pool, feature_instance_id: str) -> list[dict]:
    async with pool.acquire() as conn:
        rows = await conn.fetch(
            f"""SELECT r.*, d.content_html AS document_content_html, {_LABEL_IDS_SQL}
               FROM recipes r
               LEFT JOIN documents d ON d.id = r.document_id
               WHERE r.feature_instance_id = $1 AND r.status = 'active'
               ORDER BY r.name ASC""",
            UUID(feature_instance_id),
        )
    return [dict(r) for r in rows]


async def fetch_recipes_for_project(pool, project_id: str) -> list[dict]:
    async with pool.acquire() as conn:
        rows = await conn.fetch(
            f"""SELECT r.*, d.content_html AS document_content_html, {_LABEL_IDS_SQL}
               FROM recipes r
               JOIN projects_features pf ON pf.id = r.feature_instance_id AND pf.status = 'active'
               LEFT JOIN documents d ON d.id = r.document_id
               WHERE pf.project_id = $1 AND r.status = 'active'
               ORDER BY r.name ASC""",
            UUID(project_id),
        )
    return [dict(r) for r in rows]


async def update_recipe(pool, recipe_id: str, updates: dict, user_id: str) -> None:
    if not updates:
        return
    fields = {"updated_by": UUID(user_id), **updates}
    set_clauses = ", ".join(f"{k} = ${i + 2}" for i, k in enumerate(fields.keys()))
    async with pool.acquire() as conn:
        await conn.execute(f"UPDATE recipes SET {set_clauses} WHERE id = $1", UUID(recipe_id), *fields.values())


async def upsert_document(pool, recipe_id: str, content_html: str, user_id: str) -> None:
    uid = UUID(user_id)
    rid = UUID(recipe_id)
    content_text = strip_html(content_html)
    content_summary = extract_content_summary(content_html)
    now = datetime.now(timezone.utc)
    async with pool.acquire() as conn:
        doc_id = await conn.fetchval("SELECT document_id FROM recipes WHERE id = $1", rid)
        if doc_id is None:
            new_doc_id = await conn.fetchval(
                """INSERT INTO documents (content_html, content_text, content_summary, created_by, updated_by)
                   VALUES ($1, $2, $3, $4, $4) RETURNING id""",
                content_html, content_text, content_summary, uid,
            )
            await conn.execute("UPDATE recipes SET document_id = $1 WHERE id = $2", new_doc_id, rid)
        else:
            await conn.execute(
                """UPDATE documents SET content_html=$1, content_text=$2, content_summary=$3,
                   updated_at=$4, updated_by=$5 WHERE id=$6""",
                content_html, content_text, content_summary, now, uid, doc_id,
            )


async def delete_recipe(pool, recipe_id: str) -> None:
    async with pool.acquire() as conn:
        await conn.execute("DELETE FROM recipes WHERE id = $1", UUID(recipe_id))


async def fetch_catalog_item(pool, groceries_item_id: str) -> Optional[dict]:
    """Read-only lookup of a shared groceries catalog article, by table rather than by
    importing the groceries feature package, so recipes stays decoupled from it."""
    async with pool.acquire() as conn:
        row = await conn.fetchrow(
            "SELECT id, name, unit, is_divisible FROM groceries_items WHERE id = $1 AND status = 'active'",
            UUID(groceries_item_id),
        )
    return dict(row) if row else None


async def fetch_ingredients_detail(pool, recipe_id: str) -> list[dict]:
    async with pool.acquire() as conn:
        rows = await conn.fetch(
            """SELECT ri.id, ri.groceries_item_id,
                      COALESCE(gi.name, ri.custom_name) AS name,
                      COALESCE(gi.unit, ri.custom_unit) AS unit,
                      COALESCE(gi.is_divisible, TRUE) AS is_divisible,
                      ri.quantity, ri.display_override, ri.position, ri.is_accompaniment
               FROM recipe_ingredients ri
               LEFT JOIN groceries_items gi ON gi.id = ri.groceries_item_id
               WHERE ri.recipe_id = $1 AND ri.status = 'active'
               ORDER BY ri.position ASC""",
            UUID(recipe_id),
        )
    return [dict(r) for r in rows]


async def insert_ingredient(
    pool, recipe_id: str, groceries_item_id: Optional[str], custom_name: Optional[str],
    custom_unit: Optional[str], quantity: float, display_override: Optional[str],
    is_accompaniment: bool, user_id: str,
) -> dict:
    async with pool.acquire() as conn:
        position = await conn.fetchval(
            "SELECT COALESCE(MAX(position), -1) + 1 FROM recipe_ingredients WHERE recipe_id = $1",
            UUID(recipe_id),
        )
        row = await conn.fetchrow(
            """INSERT INTO recipe_ingredients
                   (recipe_id, groceries_item_id, custom_name, custom_unit, quantity, display_override,
                    position, is_accompaniment, created_by, updated_by)
               VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9, $9) RETURNING *""",
            UUID(recipe_id), UUID(groceries_item_id) if groceries_item_id else None,
            custom_name, custom_unit, quantity, display_override, position, is_accompaniment, UUID(user_id),
        )
    return dict(row)


async def fetch_ingredient(pool, ingredient_id: str) -> Optional[dict]:
    async with pool.acquire() as conn:
        row = await conn.fetchrow("SELECT * FROM recipe_ingredients WHERE id = $1", UUID(ingredient_id))
    return dict(row) if row else None


async def update_ingredient(
    pool, ingredient_id: str, quantity: Optional[float], position: Optional[int],
    is_accompaniment: Optional[bool], display_override: Optional[str], update_display_override: bool,
    user_id: str,
) -> dict:
    fields: dict = {"updated_by": UUID(user_id)}
    if quantity is not None:
        fields["quantity"] = quantity
    if position is not None:
        fields["position"] = position
    if is_accompaniment is not None:
        fields["is_accompaniment"] = is_accompaniment
    if update_display_override:
        fields["display_override"] = display_override
    set_clauses = ", ".join(f"{k} = ${i + 2}" for i, k in enumerate(fields.keys()))
    async with pool.acquire() as conn:
        row = await conn.fetchrow(
            f"UPDATE recipe_ingredients SET {set_clauses} WHERE id = $1 RETURNING *",
            UUID(ingredient_id), *fields.values(),
        )
    return dict(row)


async def delete_ingredient(pool, ingredient_id: str) -> None:
    async with pool.acquire() as conn:
        await conn.execute("DELETE FROM recipe_ingredients WHERE id = $1", UUID(ingredient_id))
