from fastapi import APIRouter, Depends, status

from app.features.language import access, lesson_score
from app.features.language.score_models import LessonScoreResponse
from app.features.language.test import service
from app.features.language.test.models import TestAnswerResult, TestAnswerSubmit
from app.platform.core.authentication.router import get_current_user
from app.platform.core.authorization.models import PermissionEnum
from app.platform.core.authorization.router import require_any_permission_decorator
from app.platform.core.database import get_database

router = APIRouter(prefix="/language", tags=["features_language_test"])

_PERMISSIONS = (PermissionEnum.ADMIN, PermissionEnum.CAN_ACCESS_OWN_TRIBES)


@router.post(
    "/lessons/{lesson_id}/test/attempts", response_model=TestAnswerResult,
    status_code=status.HTTP_201_CREATED,
)
@require_any_permission_decorator(*_PERMISSIONS)
async def submit_answer(lesson_id: str, data: TestAnswerSubmit, current_user: dict = Depends(get_current_user)):
    """Submit a test answer for a word, either typed freely or picked among choices.

    **Permissions:** admin | can_access_attached_tribes
    **Feature access:** minimum position >= guest
    """
    pool = get_database()
    await access.check_lesson_access(pool, lesson_id, current_user, "guest")
    return await service.submit_answer(pool, lesson_id, data, current_user["id"])


@router.get("/lessons/{lesson_id}/test/score", response_model=LessonScoreResponse)
@require_any_permission_decorator(*_PERMISSIONS)
async def get_lesson_score(lesson_id: str, current_user: dict = Depends(get_current_user)):
    """See the signed-in user's overall score for the lesson and each word's own score and
    attempt history (another member's score is read from the result sub-package).

    **Permissions:** admin | can_access_attached_tribes
    **Feature access:** minimum position >= guest
    """
    pool = get_database()
    await access.check_lesson_access(pool, lesson_id, current_user, "guest")
    return await lesson_score.get_lesson_score(pool, lesson_id, str(current_user["id"]))
