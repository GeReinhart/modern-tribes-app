from uuid import UUID

_RECIPE_LABEL_IDS_SQL = """ARRAY(
                          SELECT le.label_id::text FROM label_entities le
                          WHERE le.entity_type = 'recipe' AND le.entity_id = r.id
                      ) AS label_ids"""


async def fetch_recipes_detail_for_ids(pool, recipe_ids: list[str]) -> list[dict]:
    """Recipe fields needed for a PDF export, queried directly off the recipes/documents
    tables rather than by importing the recipes feature package, so meals stays decoupled
    from it (mirrors recipes.repository.fetch_catalog_item's approach to groceries)."""
    if not recipe_ids:
        return []
    async with pool.acquire() as conn:
        rows = await conn.fetch(
            f"""SELECT r.*, d.content_html AS document_content_html, {_RECIPE_LABEL_IDS_SQL}
               FROM recipes r
               LEFT JOIN documents d ON d.id = r.document_id
               WHERE r.id = ANY($1) AND r.status = 'active'
               ORDER BY r.name ASC""",
            [UUID(rid) for rid in recipe_ids],
        )
    return [{**dict(r), "id": str(r["id"])} for r in rows]


async def fetch_recipe_ingredients_for_ids(pool, recipe_ids: list[str]) -> dict[str, list[dict]]:
    if not recipe_ids:
        return {}
    async with pool.acquire() as conn:
        rows = await conn.fetch(
            """SELECT ri.recipe_id, COALESCE(gi.name, ri.custom_name) AS name,
                      COALESCE(gi.unit, ri.custom_unit) AS unit, ri.quantity
               FROM recipe_ingredients ri
               LEFT JOIN groceries_items gi ON gi.id = ri.groceries_item_id
               WHERE ri.recipe_id = ANY($1) AND ri.status = 'active'
               ORDER BY ri.recipe_id, ri.position ASC""",
            [UUID(rid) for rid in recipe_ids],
        )
    result: dict = {}
    for r in rows:
        result.setdefault(str(r["recipe_id"]), []).append(
            {"name": r["name"], "unit": r["unit"], "quantity": r["quantity"]}
        )
    return result
