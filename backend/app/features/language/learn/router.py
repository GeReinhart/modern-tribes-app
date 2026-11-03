from fastapi import APIRouter, Depends, Response

from app.features.language import access
from app.features.language.learn import service
from app.features.language.learn.models import LessonLearnResponse
from app.features.language.learn.pdf_render import render_lesson_pdf
from app.platform.core.authentication.router import get_current_user
from app.platform.core.authorization.models import PermissionEnum
from app.platform.core.authorization.router import require_any_permission_decorator
from app.platform.core.database import get_database

router = APIRouter(prefix="/language", tags=["features_language_learn"])

_PERMISSIONS = (PermissionEnum.ADMIN, PermissionEnum.CAN_ACCESS_OWN_TRIBES)


@router.get("/lessons/{lesson_id}/learn", response_model=LessonLearnResponse)
@require_any_permission_decorator(*_PERMISSIONS)
async def view_lesson(lesson_id: str, current_user: dict = Depends(get_current_user)):
    """View a lesson's content and full word list to learn it.

    **Permissions:** admin | can_access_attached_tribes
    **Feature access:** minimum position >= guest
    """
    pool = get_database()
    await access.check_lesson_access(pool, lesson_id, current_user, "guest")
    return await service.get_lesson_for_learning(pool, lesson_id)


@router.get("/lessons/{lesson_id}/learn/pdf")
@require_any_permission_decorator(*_PERMISSIONS)
async def download_lesson_pdf(lesson_id: str, lang: str = "en", current_user: dict = Depends(get_current_user)):
    """Download the lesson as a printable PDF. `lang` (en | fr) is the language of the
    word-type group titles; unknown values fall back to English.

    **Permissions:** admin | can_access_attached_tribes
    **Feature access:** minimum position >= guest
    """
    pool = get_database()
    await access.check_lesson_access(pool, lesson_id, current_user, "guest")
    lesson = await service.get_lesson_for_learning(pool, lesson_id)
    learned_language = await service.get_learned_language(pool, lesson_id)
    pdf_bytes = render_lesson_pdf(lesson, learned_language, lang)
    filename = f"{lesson.title}.pdf".replace("/", "-")
    return Response(
        content=pdf_bytes,
        media_type="application/pdf",
        headers={"Content-Disposition": f'attachment; filename="{filename}"'},
    )
