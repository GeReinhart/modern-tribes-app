# Ports the read-only ingredient display used by RecipeIngredientRow.tsx / ingredientOrdering.ts
# (name — quantity+unit, grouped into main/accompaniments/condiments) so the printed PDF matches
# the recipe's actual on-screen presentation instead of a plain flat list.

_GRAMS_PER_KG = 1000
_COMPACT_UNIT_SYMBOLS = {"gram": "g", "kg": "kg", "liter": "L"}
GROUP_ORDER = ("main", "accompaniment", "condiment")
GROUP_LABELS_FR = {"accompaniment": "Accompagnements", "condiment": "Condiments"}


def ingredient_group(ingredient: dict) -> str:
    if ingredient.get("is_condiment"):
        return "condiment"
    if ingredient.get("is_accompaniment"):
        return "accompaniment"
    return "main"


def _normalize_weight_for_display(quantity: float, unit: str | None) -> tuple[float, str | None]:
    if unit not in ("gram", "kg"):
        return quantity, unit
    grams = quantity if unit == "gram" else quantity * _GRAMS_PER_KG
    return (grams, "gram") if grams < _GRAMS_PER_KG else (grams / _GRAMS_PER_KG, "kg")


def _format_quantity(display_quantity: float, is_divisible: bool) -> str:
    if is_divisible:
        rounded = round(display_quantity * 100) / 100
        return str(int(rounded)) if rounded == int(rounded) else str(rounded)
    return str(int(round(display_quantity)))


def format_quantity_unit(quantity: float, unit: str | None, is_divisible: bool) -> str:
    if unit == "none":
        return ""
    display_quantity, display_unit = _normalize_weight_for_display(float(quantity), unit)
    formatted = _format_quantity(display_quantity, is_divisible)
    if not display_unit or display_unit == "piece":
        return formatted
    symbol = _COMPACT_UNIT_SYMBOLS.get(display_unit, display_unit)
    return f"{formatted}{symbol}"


def ingredient_display_text(ingredient: dict) -> str:
    quantity_label = ingredient.get("display_override") or format_quantity_unit(
        ingredient["quantity"], ingredient["unit"], ingredient["is_divisible"],
    )
    return f"{ingredient['name']} — {quantity_label}" if quantity_label else ingredient["name"]
