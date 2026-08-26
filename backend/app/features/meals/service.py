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
    added_meal_ids = await meals_repository.fetch_added_meal_ids(pool, groceries_list_id)

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
                "added": str(r["meal_id"]) in added_meal_ids,
                "ingredients": [],
            }
            order.append(key)
        groups[key]["ingredients"].append({
            "recipe_ingredient_id": str(r["recipe_ingredient_id"]),
            "groceries_item_id": str(r["groceries_item_id"]) if r["groceries_item_id"] else None,
            "name": r["ingredient_name"],
            "unit": r["ingredient_unit"],
            "quantity": _scale_quantity(r["quantity"], r["headcount"], r["servings"], r["is_divisible"]),
            "is_accompaniment": r["is_accompaniment"],
        })
    return [groups[k] for k in order]


async def add_meal_to_groceries_list(pool, groceries_list_id: str, meal_id: str, user_id: str) -> Optional[list[dict]]:
    """Scales and inserts every ingredient of every recipe linked to this meal into the
    groceries list, then marks the meal as added (with its current headcount) so it stops
    being suggested. Returns None if the list/meal isn't in a state this can apply to
    (list missing or already shopped, meal missing/archived, already added, or no
    ingredients to add) — the router turns that into a 400."""
    scope = await meals_repository.fetch_groceries_list_scope(pool, groceries_list_id)
    if not scope or scope["list_status"] != "planned":
        return None

    added_meal_ids = await meals_repository.fetch_added_meal_ids(pool, groceries_list_id)
    if meal_id in added_meal_ids:
        return None

    meal = await meals_repository.fetch_meal(pool, meal_id)
    if not meal or meal["status"] != "active":
        return None

    rows = await meals_repository.fetch_meal_ingredient_rows(pool, meal_id)
    if not rows:
        return None

    items = [
        {
            "groceries_item_id": str(r["groceries_item_id"]) if r["groceries_item_id"] else None,
            "custom_name": r["custom_name"],
            "custom_unit": r["custom_unit"],
            "quantity": _scale_quantity(r["quantity"], meal["headcount"], r["servings"], r["is_divisible"]),
        }
        for r in rows
    ]
    await meals_repository.insert_list_items_bulk(pool, groceries_list_id, items, user_id)
    await meals_repository.mark_meal_added(pool, groceries_list_id, meal_id, meal["headcount"], user_id)
    return items


async def remove_meal_from_groceries_list(pool, groceries_list_id: str, meal_id: str, user_id: str) -> bool:
    """Un-marks a meal as added, so it's suggested again on this list. Does not touch the
    groceries list items already added for it — those may have merged with other
    quantities already on the list, so they're left for the user to adjust by hand."""
    scope = await meals_repository.fetch_groceries_list_scope(pool, groceries_list_id)
    if not scope:
        return False
    added_meal_ids = await meals_repository.fetch_added_meal_ids(pool, groceries_list_id)
    if meal_id not in added_meal_ids:
        return False
    await meals_repository.unmark_meal_added(pool, groceries_list_id, meal_id, user_id)
    return True


async def add_ingredient_to_groceries_list(
    pool, groceries_list_id: str, meal_id: str, recipe_ingredient_id: str, user_id: str,
) -> Optional[dict]:
    """Adds a single suggested ingredient (typically an accompaniment) to the list, scaled
    to the meal's headcount — unlike add_meal_to_groceries_list, doesn't mark the meal as
    added, since accompaniments can be added independently of the meal's core ingredients."""
    scope = await meals_repository.fetch_groceries_list_scope(pool, groceries_list_id)
    if not scope or scope["list_status"] != "planned":
        return None
    meal = await meals_repository.fetch_meal(pool, meal_id)
    if not meal or meal["status"] != "active":
        return None
    row = await meals_repository.fetch_single_recipe_ingredient_for_meal(pool, meal_id, recipe_ingredient_id)
    if not row:
        return None
    item = {
        "groceries_item_id": str(row["groceries_item_id"]) if row["groceries_item_id"] else None,
        "custom_name": row["custom_name"],
        "custom_unit": row["custom_unit"],
        "quantity": _scale_quantity(row["quantity"], meal["headcount"], row["servings"], row["is_divisible"]),
    }
    await meals_repository.insert_list_items_bulk(pool, groceries_list_id, [item], user_id)
    return item
