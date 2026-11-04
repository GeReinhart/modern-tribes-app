from datetime import date, timedelta

from fastapi import HTTPException

from app.features.language import access, lesson_score, scoring
from app.features.language.result import effort, repository
from app.features.language.result.models import (
    CompetitionMember, CompetitionResponse, EffortDay, EffortResponse, ResultMember, ScoreHistoryPoint, ScoreHistoryResponse,
)
from app.features.language.score_models import LessonScoreResponse


async def list_members(pool, lesson_id: str) -> list[ResultMember]:
    project_id = await access.get_lesson_project_id(pool, lesson_id)
    return [ResultMember(**row) for row in await repository.list_project_members(pool, project_id)]


async def resolve_score_user(pool, lesson_id: str, requested_user_id: str | None, current_user_id: str) -> str:
    """The user whose results are shown: the requested project member, else the signed-in user."""
    if requested_user_id is None or requested_user_id == current_user_id:
        return current_user_id
    members = await list_members(pool, lesson_id)
    if requested_user_id not in {m.user_id for m in members}:
        raise HTTPException(status_code=404, detail="Member not found")
    return requested_user_id


async def get_lesson_score(pool, lesson_id: str, user_id: str) -> LessonScoreResponse:
    return await lesson_score.get_lesson_score(pool, lesson_id, user_id)


async def get_score_history(pool, lesson_id: str, user_id: str) -> ScoreHistoryResponse:
    """The lesson's overall score at the end of each day, from the first answer until today."""
    return ScoreHistoryResponse(points=await _history_points(pool, lesson_id, user_id))


async def _history_points(pool, lesson_id: str, user_id: str) -> list[ScoreHistoryPoint]:
    words = [inputs for _, inputs in await lesson_score.lesson_word_inputs(pool, lesson_id, user_id)]
    first_day = min((a["created_at"].date() for attempts, _, _ in words for a in attempts), default=None)
    if first_day is None:
        return []
    days = [first_day + timedelta(days=n) for n in range((date.today() - first_day).days + 1)]
    return [_history_point(words, day) for day in days]


def _history_point(words: list, day: date) -> ScoreHistoryPoint:
    scores = [
        scoring.word_score([a for a in attempts if a["created_at"].date() <= day], day, has_article, has_plural)
        for attempts, has_article, has_plural in words
    ]
    return ScoreHistoryPoint(date=day, score=round(sum(scores) / len(scores), 4))


async def get_effort(pool, lesson_id: str, user_id: str) -> EffortResponse:
    """The weighted successes and errors of each day, from the first answer until today."""
    words = await lesson_score.lesson_word_inputs(pool, lesson_id, user_id)
    attempts = [a for _, (word_attempts, _, _) in words for a in word_attempts]
    days = effort.daily_effort(attempts, date.today())
    return EffortResponse(days=[EffortDay(date=day, success=ok, errors=ko) for day, ok, ko in days])


async def get_competition(pool, lesson_id: str) -> CompetitionResponse:
    """The score history of every project member who answered at least once."""
    members = []
    for member in await list_members(pool, lesson_id):
        points = await _history_points(pool, lesson_id, member.user_id)
        if points:
            members.append(CompetitionMember(user_id=member.user_id, name=member.name, points=points))
    return CompetitionResponse(members=members)
