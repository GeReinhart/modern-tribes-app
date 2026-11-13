from fastapi import HTTPException

from app.features.language import access, lesson_score, snapshots
from app.features.language.result import repository
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
    rows = await snapshots.get_snapshots(pool, lesson_id, user_id)
    return [ScoreHistoryPoint(date=r["day"], score=r["score"]) for r in rows]


async def get_effort(pool, lesson_id: str, user_id: str) -> EffortResponse:
    """The weighted successes and errors of each day, from the first answer until today."""
    rows = await snapshots.get_snapshots(pool, lesson_id, user_id)
    return EffortResponse(days=[EffortDay(date=r["day"], success=r["success"], errors=r["errors"]) for r in rows])


async def get_competition(pool, lesson_id: str) -> CompetitionResponse:
    """The score history of every person who answered the lesson's test, member or not."""
    members = []
    for person in await repository.list_answering_users(pool, lesson_id):
        points = await _history_points(pool, lesson_id, person["user_id"])
        if points:
            members.append(CompetitionMember(user_id=person["user_id"], name=person["name"], points=points))
    return CompetitionResponse(members=members)
