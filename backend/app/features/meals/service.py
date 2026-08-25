import math
from typing import Optional

from app.features.meals import repository as meals_repository


def _scale_quantity(quantity: float, headcount: int, servings: int, is_divisible: bool) -> float:
    scaled = float(quantity) * headcount / servings
    if is_divisible:
        return round(scaled, 2)
    return float(math.ceil(scaled - 1e-9))


async def compute_grocery_suggestions(pool, groceries_list_id: str) -> Optional[list[dict]]:
    """Ingredients of meals planned after this groceries list's date, scaled to each
    meal's headcount. Returns None if the list itself doesn't exist, [] if the list is
    not in 'planned' state (already shopped for)."""
    scope = await meals_repository.fetch_groceries_list_scope(pool, groceries_list_id)
    if not scope:
        return None
    if scope["list_status"] != "planned":
        return []

    rows = await meals_repository.fetch_grocery_suggestion_rows(pool, str(scope["project_id"]), scope["scheduled_date"])

    groups: dict = {}
    order: list = []
    for r in rows:
        key = (str(r["meal_id"]), str(r["recipe_id"]))
        if key not in groups:
            groups[key] = {
                "meal_id": str(r["meal_id"]),
                "meal_title": r["meal_title"],
                "meal_start_at": r["meal_start_at"],
                "recipe_id": str(r["recipe_id"]),
                "recipe_name": r["recipe_name"],
                "headcount": r["headcount"],
                "ingredients": [],
            }
            order.append(key)
        groups[key]["ingredients"].append({
            "groceries_item_id": str(r["groceries_item_id"]) if r["groceries_item_id"] else None,
            "name": r["ingredient_name"],
            "unit": r["ingredient_unit"],
            "quantity": _scale_quantity(r["quantity"], r["headcount"], r["servings"], r["is_divisible"]),
        })
    return [groups[k] for k in order]
