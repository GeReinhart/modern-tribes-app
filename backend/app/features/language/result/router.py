from typing import List, Optional

from fastapi import APIRouter, Depends

from app.features.language import access
from app.features.language.result import service
from app.features.language.result.models import (
    CompetitionResponse, EffortResponse, ResultMember, ScoreHistoryResponse,
)
from app.features.language.score_models import LessonScoreResponse
from app.platform.core.authentication.router import get_current_user
from app.platform.core.authorization.models import PermissionEnum
from app.platform.core.authorization.router import require_any_permission_decorator
from app.platform.core.database import get_database

router = APIRouter(prefix="/language", tags=["features_language_result"])

_PERMISSIONS = (PermissionEnum.ADMIN, PermissionEnum.CAN_ACCESS_OWN_TRIBES)


@router.get("/lessons/{lesson_id}/result/score", response_model=LessonScoreResponse)
@require_any_permission_decorator(*_PERMISSIONS)
async def get_lesson_score(
    lesson_id: str, user_id: Optional[str] = None, current_user: dict = Depends(get_current_user),
):
    """See the lesson's overall score and each word's own score and attempt history, for
    the signed-in user or, with `user_id`, for another member of the project.

    **Permissions:** admin | can_access_attached_tribes
    **Feature access:** minimum position >= guest
    """
    pool = get_database()
    await access.check_lesson_access(pool, lesson_id, current_user, "guest")
    target_user_id = await service.resolve_score_user(pool, lesson_id, user_id, str(current_user["id"]))
    return await service.get_lesson_score(pool, lesson_id, target_user_id)


@router.get("/lessons/{lesson_id}/result/score/history", response_model=ScoreHistoryResponse)
@require_any_permission_decorator(*_PERMISSIONS)
async def get_score_history(
    lesson_id: str, user_id: Optional[str] = None, current_user: dict = Depends(get_current_user),
):
    """See how the lesson's overall score evolved day by day, for the signed-in user or, with
    `user_id`, for another member of the project.

    **Permissions:** admin | can_access_attached_tribes
    **Feature access:** minimum position >= guest
    """
    pool = get_database()
    await access.check_lesson_access(pool, lesson_id, current_user, "guest")
    target_user_id = await service.resolve_score_user(pool, lesson_id, user_id, str(current_user["id"]))
    return await service.get_score_history(pool, lesson_id, target_user_id)


@router.get("/lessons/{lesson_id}/result/effort", response_model=EffortResponse)
@require_any_permission_decorator(*_PERMISSIONS)
async def get_effort(
    lesson_id: str, user_id: Optional[str] = None, current_user: dict = Depends(get_current_user),
):
    """See how much effort went into the lesson day by day (answers weighted by importance,
    split between successes and errors), for the signed-in user or, with `user_id`, for another
    member of the project.

    **Permissions:** admin | can_access_attached_tribes
    **Feature access:** minimum position >= guest
    """
    pool = get_database()
    await access.check_lesson_access(pool, lesson_id, current_user, "guest")
    target_user_id = await service.resolve_score_user(pool, lesson_id, user_id, str(current_user["id"]))
    return await service.get_effort(pool, lesson_id, target_user_id)


@router.get("/lessons/{lesson_id}/result/competition", response_model=CompetitionResponse)
@require_any_permission_decorator(*_PERMISSIONS)
async def get_competition(lesson_id: str, current_user: dict = Depends(get_current_user)):
    """See the overall score history of every project member who answered the lesson's test.

    **Permissions:** admin | can_access_attached_tribes
    **Feature access:** minimum position >= guest
    """
    pool = get_database()
    await access.check_lesson_access(pool, lesson_id, current_user, "guest")
    return await service.get_competition(pool, lesson_id)


@router.get("/lessons/{lesson_id}/result/members", response_model=List[ResultMember])
@require_any_permission_decorator(*_PERMISSIONS)
async def list_test_members(lesson_id: str, current_user: dict = Depends(get_current_user)):
    """List the project's members whose results can be consulted.

    **Permissions:** admin | can_access_attached_tribes
    **Feature access:** minimum position >= guest
    """
    pool = get_database()
    await access.check_lesson_access(pool, lesson_id, current_user, "guest")
    return await service.list_members(pool, lesson_id)
