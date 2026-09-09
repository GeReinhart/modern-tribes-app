from datetime import date, datetime, timedelta
from zoneinfo import ZoneInfo

from app.features.meals import repository as meals_repository
from app.features.meals.pdf import render as pdf_render
from app.features.meals.pdf import repository as pdf_repository
from app.platform.functions.labels.repository import fetch_label_details

# Meal slots are picked and stored as fixed local wall-clock times (see the frontend's
# mealDateUtils.ts) but persisted as UTC instants — this app has a single household of users,
# all in this timezone, so bucketing by it (rather than a per-project setting) mirrors what the
# browser itself does when re-deriving a meal's slot from its start_at.
_TZ_PARIS = ZoneInfo("Europe/Paris")
_SLOT_ORDER = ("morning", "midday", "evening")


def _slot_from_start_at(start_at: datetime) -> str:
    """Mirrors the frontend's mealDateUtils.ts slotFromTime: buckets by the LOCAL hour of a
    fixed-slot meal time (08:00/12:00/20:00), not the UTC hour start_at is stored as."""
    hour = start_at.astimezone(_TZ_PARIS).hour
    if hour < 11:
        return "morning"
    if hour < 17:
        return "midday"
    return "evening"


def _group_meals_by_cell(meals: list[dict]) -> tuple[dict, list[str]]:
    by_cell: dict = {}
    used_slots: set = set()
    for m in meals:
        slot = _slot_from_start_at(m["start_at"])
        by_cell.setdefault((m["start_at"].date(), slot), []).append(m)
        used_slots.add(slot)
    visible_slots = [s for s in _SLOT_ORDER if s in used_slots]
    return by_cell, visible_slots


def _date_range(start_date: date, end_date: date) -> list[date]:
    return [start_date + timedelta(days=i) for i in range((end_date - start_date).days + 1)]


async def build_meals_pdf(pool, feature_instance_id: str, start_date: date, end_date: date) -> bytes:
    """Printable export for a date range: a day x slot table on the first page (columns
    limited to the slots actually used in that range, mirroring the web view), then one card
    per recipe linked to any of those meals on the following pages."""
    all_meals = await meals_repository.fetch_meals_for_instance(pool, feature_instance_id)
    meals = [m for m in all_meals if start_date <= m["start_at"].date() <= end_date]
    by_cell, visible_slots = _group_meals_by_cell(meals)

    recipe_ids = sorted({rid for m in meals for rid in m["recipe_ids"]})
    recipes = await pdf_repository.fetch_recipes_detail_for_ids(pool, recipe_ids)
    ingredients_by_recipe = await pdf_repository.fetch_recipe_ingredients_for_ids(pool, recipe_ids)
    label_ids = sorted({lid for r in recipes for lid in r["label_ids"]})
    label_details = await fetch_label_details(pool, label_ids)

    return pdf_render.render_meals_pdf(
        dates=_date_range(start_date, end_date),
        visible_slots=visible_slots,
        by_cell=by_cell,
        recipes=recipes,
        ingredients_by_recipe=ingredients_by_recipe,
        label_details=label_details,
    )
