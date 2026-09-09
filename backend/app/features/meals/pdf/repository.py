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


_IS_CONDIMENT_SQL = """EXISTS (
                          SELECT 1 FROM groceries_item_sections gis
                          JOIN groceries_sections gs ON gs.id = gis.groceries_section_id
                          WHERE gis.groceries_item_id = ri.groceries_item_id
                            AND gs.is_condiment = TRUE AND gs.status = 'active'
                      ) AS is_condiment"""


async def fetch_recipe_ingredients_for_ids(pool, recipe_ids: list[str]) -> dict[str, list[dict]]:
    """Same field set as recipes.repository.fetch_ingredients_detail (name/unit/quantity plus
    is_divisible/display_override/is_accompaniment/is_condiment), queried directly rather than
    imported, so the PDF's ingredient list can match the recipe's own read-only presentation."""
    if not recipe_ids:
        return {}
    async with pool.acquire() as conn:
        rows = await conn.fetch(
            f"""SELECT ri.recipe_id, COALESCE(gi.name, ri.custom_name) AS name,
                      COALESCE(gi.unit, ri.custom_unit) AS unit,
                      COALESCE(gi.is_divisible, TRUE) AS is_divisible,
                      ri.quantity, ri.display_override, ri.is_accompaniment, {_IS_CONDIMENT_SQL}
               FROM recipe_ingredients ri
               LEFT JOIN groceries_items gi ON gi.id = ri.groceries_item_id
               WHERE ri.recipe_id = ANY($1) AND ri.status = 'active'
               ORDER BY ri.recipe_id, ri.position ASC""",
            [UUID(rid) for rid in recipe_ids],
        )
    result: dict = {}
    for r in rows:
        result.setdefault(str(r["recipe_id"]), []).append({
            "name": r["name"], "unit": r["unit"], "quantity": r["quantity"],
            "is_divisible": r["is_divisible"], "display_override": r["display_override"],
            "is_accompaniment": r["is_accompaniment"], "is_condiment": r["is_condiment"],
        })
    return result
