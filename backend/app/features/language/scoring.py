"""The word scoring formula.

A word's score is made of points, per component: 6 for each translation direction, plus 3 for
the article and 3 for the plural when the word's learned-language noun has one. A component
reaches its maximum after 3 distinct days of correct answers (so a direction earns 2 points a
day, the article and the plural 1 point a day), and never earns more than its maximum -- extra
days in one component do not make up for another. The score is the points earned over the
points possible for that word (12, 15 or 18).

A correct multiple-choice translation answer on a day with no free success counts for only a
fifth of a day, so picking from choices barely moves the score compared to answering freely.
A correct article or plural answer always counts as a full day. A word untested for N full
weeks has its score reduced by 10% per week, compounding, down toward (never below) zero.
"""
from collections import defaultdict
from datetime import date, datetime

_DAYS_NEEDED = 3
_TRANSLATION_POINTS = 6
_FACT_POINTS = 3
_TRANSLATION_DIRECTIONS = ("source_to_target", "target_to_source")
FACT_DIRECTIONS = ("article", "plural")
CHOICE_DAY_VALUE = 0.2
_FREE_DAY_VALUE = 1.0
_DECAY_PER_WEEK = 0.9


def _day_value(attempts_on_day: list[dict]) -> float:
    if any(a["correct"] and (a["direction"] in FACT_DIRECTIONS or a["mode"] == "free") for a in attempts_on_day):
        return _FREE_DAY_VALUE  # an article is picked among few, but 3 distinct days are still needed
    if any(a["mode"] == "choice" and a["correct"] for a in attempts_on_day):
        return CHOICE_DAY_VALUE
    return 0.0


def _direction_units(attempts: list[dict], direction: str) -> float:
    by_day = defaultdict(list)
    for attempt in attempts:
        if attempt["direction"] == direction:
            by_day[attempt["created_at"].date()].append(attempt)
    return sum(_day_value(day_attempts) for day_attempts in by_day.values())


def _component_points(attempts: list[dict], direction: str, max_points: int) -> float:
    earned = _direction_units(attempts, direction) * max_points / _DAYS_NEEDED
    return min(float(max_points), earned)


def _components(has_article: bool, has_plural: bool) -> list[tuple[str, int]]:
    components = [(direction, _TRANSLATION_POINTS) for direction in _TRANSLATION_DIRECTIONS]
    if has_article:
        components.append(("article", _FACT_POINTS))
    if has_plural:
        components.append(("plural", _FACT_POINTS))
    return components


def raw_word_score(attempts: list[dict], has_article: bool = False, has_plural: bool = False) -> float:
    components = _components(has_article, has_plural)
    earned = sum(_component_points(attempts, direction, points) for direction, points in components)
    return earned / sum(points for _, points in components)


def last_tested_at(attempts: list[dict]) -> datetime | None:
    return attempts[-1]["created_at"] if attempts else None


def decayed_word_score(raw_score: float, tested_at: datetime | None, today: date) -> float:
    if not tested_at or raw_score == 0:
        return raw_score
    weeks_elapsed = (today - tested_at.date()).days // 7
    if weeks_elapsed <= 0:
        return raw_score
    return raw_score * (_DECAY_PER_WEEK ** weeks_elapsed)


def word_score(attempts: list[dict], today: date, has_article: bool = False, has_plural: bool = False) -> float:
    return decayed_word_score(raw_word_score(attempts, has_article, has_plural), last_tested_at(attempts), today)
