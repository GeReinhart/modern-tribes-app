"""The daily effort of a person on a lesson: how much they answered each day, split between
successes and errors.

An answer weighs 1 when it was typed freely (or is an article / plural answer) and only a
fifth when it was picked among choices, like in the word scoring: picking from choices is much
less effort than answering freely. The weight applies to successes and errors alike.
"""
from datetime import date, timedelta

from app.features.language.test.scoring import CHOICE_DAY_VALUE, FACT_DIRECTIONS


def answer_weight(attempt: dict) -> float:
    if attempt["direction"] in FACT_DIRECTIONS or attempt["mode"] == "free":
        return 1.0
    return CHOICE_DAY_VALUE


def daily_effort(attempts: list[dict], today: date) -> list[tuple[date, float, float]]:
    """One (day, weighted successes, weighted errors) per day, from the first answer until today."""
    if not attempts:
        return []
    totals: dict[date, list[float]] = {}
    for attempt in attempts:
        day_totals = totals.setdefault(attempt["created_at"].date(), [0.0, 0.0])
        day_totals[0 if attempt["correct"] else 1] += answer_weight(attempt)
    first_day = min(totals)
    days = (first_day + timedelta(days=n) for n in range((today - first_day).days + 1))
    return [(day, *map(lambda v: round(v, 2), totals.get(day, [0.0, 0.0]))) for day in days]
