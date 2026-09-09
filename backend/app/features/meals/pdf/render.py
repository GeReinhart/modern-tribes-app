import html
from datetime import date

from weasyprint import HTML

from app.features.meals.formatting import format_quantity

_DAY_NAMES_FR = ("Lundi", "Mardi", "Mercredi", "Jeudi", "Vendredi", "Samedi", "Dimanche")
_SLOT_LABELS_FR = {"morning": "Matin", "midday": "Midi", "evening": "Soir"}

_DOCUMENT_CSS = (
    "body { font-family: Helvetica, Arial, sans-serif; color: #1a1a1a; margin: 0; }"
    "h1 { font-size: 20px; margin: 0 0 12px; }"
    "table { width: 100%; border-collapse: collapse; margin-top: 8px; }"
    "th, td { border: 1px solid #ccc; padding: 6px; vertical-align: top; font-size: 10px; }"
    "th { background: #f2f2f2; text-transform: uppercase; font-size: 9px; }"
    ".meal-title { font-weight: 700; }"
    ".meal-headcount { color: #666666; font-size: 9px; }"
    ".recipes-columns { column-count: 2; column-gap: 10mm; margin-top: 12px; }"
    ".recipe-card { border: 1px solid #ccc; border-radius: 8px; padding: 8px 10px; margin-bottom: 10px; "
    "break-inside: avoid; page-break-inside: avoid; }"
    ".recipe-card h2 { font-size: 13px; margin: 0 0 6px; }"
    ".recipe-meta { color: #555555; font-size: 9px; margin-bottom: 6px; }"
    ".label-chip { display: inline-block; padding: 2px 8px; border-radius: 10px; font-size: 8px; "
    "margin-right: 4px; margin-bottom: 6px; color: #ffffff; }"
    ".recipe-columns { display: flex; gap: 8px; }"
    ".recipe-col { flex: 1 1 0; min-width: 0; }"
    ".ingredients { margin: 0; padding-left: 14px; font-size: 9px; }"
    ".recipe-body { font-size: 9px; }"
    ".recipe-body img { max-width: 100%; height: auto; }"
)


def render_meals_pdf(
    dates: list[date], visible_slots: list[str], by_cell: dict, recipes: list[dict],
    ingredients_by_recipe: dict, label_details: dict,
) -> bytes:
    html_document = _build_html_document(dates, visible_slots, by_cell, recipes, ingredients_by_recipe, label_details)
    return HTML(string=html_document).write_pdf()


def _build_html_document(
    dates: list[date], visible_slots: list[str], by_cell: dict, recipes: list[dict],
    ingredients_by_recipe: dict, label_details: dict,
) -> str:
    table_html = _render_table_page(dates, visible_slots, by_cell, recipes)
    cards_html = "".join(
        _render_recipe_card(r, ingredients_by_recipe.get(r["id"], []), label_details) for r in recipes
    )
    recipes_html = f'<div class="recipes-columns">{cards_html}</div>' if cards_html else ""
    footer_css = '@bottom-right { content: counter(page) " / " counter(pages); font-size: 9px; color: #666666; }'
    return (
        '<!doctype html><html><head><meta charset="utf-8" />'
        f"<style>@page {{ size: A4 portrait; margin: 15mm 12mm; {footer_css} }} {_DOCUMENT_CSS}</style>"
        f"</head><body>{table_html}{recipes_html}</body></html>"
    )


def _render_table_page(dates: list[date], visible_slots: list[str], by_cell: dict, recipes: list[dict]) -> str:
    recipe_name_by_id = {r["id"]: r["name"] for r in recipes}
    title = f"Menus — {dates[0]:%d/%m/%Y} au {dates[-1]:%d/%m/%Y}" if dates else "Menus"
    header_cells = "".join(f"<th>{html.escape(_SLOT_LABELS_FR[slot])}</th>" for slot in visible_slots)
    body_rows = "".join(_render_table_row(d, visible_slots, by_cell, recipe_name_by_id) for d in dates)
    return f"<h1>{html.escape(title)}</h1><table><thead><tr><th></th>{header_cells}</tr></thead><tbody>{body_rows}</tbody></table>"


def _render_table_row(day: date, visible_slots: list[str], by_cell: dict, recipe_name_by_id: dict) -> str:
    day_label = f"{_DAY_NAMES_FR[day.weekday()]} {day:%d/%m}"
    cells = "".join(
        f"<td>{_render_cell_meals(by_cell.get((day, slot), []), recipe_name_by_id)}</td>" for slot in visible_slots
    )
    return f"<tr><td>{html.escape(day_label)}</td>{cells}</tr>"


def _render_cell_meals(meals: list[dict], recipe_name_by_id: dict) -> str:
    return "".join(_render_meal(m, recipe_name_by_id) for m in meals)


def _render_meal(meal: dict, recipe_name_by_id: dict) -> str:
    parts = []
    if meal.get("title"):
        parts.append(f'<div class="meal-title">{html.escape(meal["title"])}</div>')
    names = [recipe_name_by_id[rid] for rid in meal["recipe_ids"] if rid in recipe_name_by_id]
    if names:
        parts.append(f'<div class="meal-recipes">{html.escape(", ".join(names))}</div>')
    parts.append(f'<div class="meal-headcount">{meal["headcount"]}p.</div>')
    return f'<div class="meal">{"".join(parts)}</div>'


def _recipe_meta_line(recipe: dict) -> str:
    parts = [f"{recipe['servings']} pers."]
    if recipe.get("difficulty") is not None:
        parts.append(f"Difficulté {recipe['difficulty']}/5")
    if recipe.get("prep_time_minutes") is not None:
        parts.append(f"Prépa {recipe['prep_time_minutes']} min")
    if recipe.get("total_time_minutes") is not None:
        parts.append(f"Total {recipe['total_time_minutes']} min")
    return html.escape(" · ".join(parts))


def _render_labels(recipe: dict, label_details: dict) -> str:
    chips = [label_details[lid] for lid in recipe["label_ids"] if lid in label_details]
    return "".join(
        f'<span class="label-chip" style="background:{html.escape(c["color"])}">{html.escape(c["name"])}</span>'
        for c in chips
    )


def _render_ingredients(ingredients: list[dict]) -> str:
    items = "".join(
        f'<li>{format_quantity(i["quantity"])} {html.escape(i["unit"] or "")} {html.escape(i["name"])}</li>'
        for i in ingredients
    )
    return f'<ul class="ingredients">{items}</ul>' if items else ""


def _render_recipe_card(recipe: dict, ingredients: list[dict], label_details: dict) -> str:
    body = recipe.get("document_content_html") or ""
    return (
        '<div class="recipe-card">'
        f"<h2>{html.escape(recipe['name'])}</h2>"
        f'<div class="recipe-meta">{_recipe_meta_line(recipe)}</div>'
        f"{_render_labels(recipe, label_details)}"
        '<div class="recipe-columns">'
        f'<div class="recipe-col">{_render_ingredients(ingredients)}</div>'
        f'<div class="recipe-col recipe-body">{body}</div>'
        "</div>"
        "</div>"
    )
