"""A person's daily results on a lesson, precomputed.

Each day holds the lesson's overall score at the end of that day and the day's weighted
successes and errors. Days before today never change, so they are computed once and stored;
today's row is rebuilt when the person answered since it was computed. Shared by the test
sub-package (refreshes after an answer) and the result sub-package (reads).
"""
from datetime import date, timedelta

from app.features.language import effort, lesson_score, scoring, snapshot_repository


async def get_snapshots(pool, lesson_id: str, user_id: str) -> list[dict]:
    """The person's stored days on the lesson, brought up to date first when they are stale."""
    rows = await snapshot_repository.list_snapshots(pool, lesson_id, user_id)
    if not await _is_up_to_date(pool, rows, user_id):
        await refresh(pool, lesson_id, user_id)
        rows = await snapshot_repository.list_snapshots(pool, lesson_id, user_id)
    return rows


async def _is_up_to_date(pool, rows: list[dict], user_id: str) -> bool:
    if not rows or rows[-1]["day"] != date.today():
        return False
    return rows[-1]["last_attempt_at"] == await snapshot_repository.last_attempt_at(pool, user_id)


async def refresh(pool, lesson_id: str, user_id: str) -> None:
    """Rebuild the days not final yet: from the day after the last stored past day until today."""
    today = date.today()
    words = await lesson_score.lesson_word_inputs(pool, lesson_id, user_id)
    attempts = [a for word_attempts, _, _ in (inputs for _, inputs in words) for a in word_attempts]
    if not attempts:
        return
    last_final = await snapshot_repository.last_final_day(pool, lesson_id, user_id, today)
    first_day = min(a["created_at"].date() for a in attempts)
    start = last_final + timedelta(days=1) if last_final else first_day
    last_at = await snapshot_repository.last_attempt_at(pool, user_id)
    rows = build_rows([inputs for _, inputs in words], attempts, start, today, last_at)
    await snapshot_repository.upsert_snapshots(pool, lesson_id, user_id, rows)


def build_rows(words: list, attempts: list[dict], start: date, today: date, last_at) -> list[dict]:
    effort_by_day = {day: (ok, ko) for day, ok, ko in effort.daily_effort(attempts, today)}
    days = [start + timedelta(days=n) for n in range((today - start).days + 1)]
    return [
        {"day": day, "score": _score_on(words, day), "last_attempt_at": last_at,
         "success": effort_by_day.get(day, (0.0, 0.0))[0], "errors": effort_by_day.get(day, (0.0, 0.0))[1]}
        for day in days
    ]


def _score_on(words: list, day: date) -> float:
    scores = [
        scoring.word_score([a for a in attempts if a["created_at"].date() <= day], day, has_article, has_plural)
        for attempts, has_article, has_plural in words
    ]
    return round(sum(scores) / len(scores), 4)
