# Scales a recipe's ingredient quantities to the number of people of the meal it is printed for.

import math

_ROUNDING_NOISE_DIGITS = 6


def servings_ratio(headcount: int | None, servings: int | None) -> float:
    """Meal headcount over recipe servings. A headcount of 0 (or a missing value) means "not
    filled in", so the recipe keeps its original quantities (ratio 1)."""
    if not headcount or not servings:
        return 1.0
    return headcount / servings


def displayed_servings(headcount: int | None, servings: int) -> int:
    return headcount if headcount else servings


def scale_ingredient(ingredient: dict, ratio: float) -> dict:
    """Free-text quantities (display_override) cannot be scaled and are kept as written.
    Indivisible ingredients (an egg, a pack) are rounded up so the printed amount is enough."""
    if ratio == 1:
        return ingredient
    quantity = float(ingredient["quantity"]) * ratio
    if not ingredient["is_divisible"]:
        quantity = math.ceil(round(quantity, _ROUNDING_NOISE_DIGITS))
    return {**ingredient, "quantity": quantity}
