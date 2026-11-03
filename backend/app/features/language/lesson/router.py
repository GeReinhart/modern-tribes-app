from typing import List, Optional

from fastapi import APIRouter, Depends, HTTPException, status

from app.features.language import access
from app.features.language.lesson import service
from app.features.language.lesson.models import (
    DictionaryWordMatch, LanguageInfo, LanguageSettingsCreate, LanguageSettingsResponse,
    LanguageThemeUpdate, LessonCreate, LessonResponse, LessonUpdate, LessonWordLink, OnlineTranslationSuggestion, TranslationSuggestion,
    WordCreate, WordResponse, WordSummary, WordTranslationInput, WordUpdate,
)
from app.platform.core.authentication.router import get_current_user
from app.platform.core.authorization.models import PermissionEnum
from app.platform.core.authorization.project_access import check_project_access_or_admin
from app.platform.core.authorization.router import require_any_permission_decorator, require_permission_decorator
from app.platform.core.database import get_database
from app.platform.core.utils.db_helpers import resolve_url_param_id
from app.platform.functions.documents.models import DocumentRevision

router = APIRouter(prefix="/language", tags=["features_language_lesson"])

_PERMISSIONS = (PermissionEnum.ADMIN, PermissionEnum.CAN_ACCESS_OWN_TRIBES)


@router.post(
    "/projects/{project_id}/settings", response_model=LanguageSettingsResponse,
    status_code=status.HTTP_201_CREATED,
)
@require_any_permission_decorator(*_PERMISSIONS)
async def set_language_pair(
    project_id: str, data: LanguageSettingsCreate, current_user: dict = Depends(get_current_user),
):
    """Set the language pair this project's lessons are about. Can only be done once.

    **Permissions:** admin | can_access_attached_tribes
    **Feature access:** minimum position >= guest
    """
    pool = get_database()
    project_id = await resolve_url_param_id(pool, "projects", project_id)
    await check_project_access_or_admin(project_id, current_user, pool, "guest")
    return await service.set_language_pair(pool, project_id, data, current_user["id"])


@router.get("/projects/{project_id}/settings", response_model=LanguageSettingsResponse)
@require_any_permission_decorator(*_PERMISSIONS)
async def get_language_pair(project_id: str, current_user: dict = Depends(get_current_user)):
    """Get the project's language pair, if one has been set.

    **Permissions:** admin | can_access_attached_tribes
    **Feature access:** minimum position >= guest
    """
    pool = get_database()
    project_id = await resolve_url_param_id(pool, "projects", project_id)
    await check_project_access_or_admin(project_id, current_user, pool, "guest")
    settings = await service.get_language_settings(pool, project_id)
    if settings is None:
        raise HTTPException(status_code=404, detail="No language pair set for this project")
    return settings


@router.get("/projects/{project_id}/lessons", response_model=List[LessonResponse])
@require_any_permission_decorator(*_PERMISSIONS)
async def list_lessons(project_id: str, current_user: dict = Depends(get_current_user)):
    """List the project's lessons.

    **Permissions:** admin | can_access_attached_tribes
    **Feature access:** minimum position >= guest
    """
    pool = get_database()
    project_id = await resolve_url_param_id(pool, "projects", project_id)
    await check_project_access_or_admin(project_id, current_user, pool, "guest")
    return await service.list_lessons(pool, project_id)


@router.get("/languages", response_model=List[LanguageInfo])
@require_any_permission_decorator(*_PERMISSIONS)
async def list_languages(current_user: dict = Depends(get_current_user)):
    """List the available languages and their configured theme, if any.

    **Permissions:** admin | can_access_attached_tribes
    """
    pool = get_database()
    return await service.list_languages(pool)


@router.patch("/languages/{code}", response_model=LanguageInfo)
@require_any_permission_decorator(*_PERMISSIONS)
async def update_language_theme(code: str, data: LanguageThemeUpdate, current_user: dict = Depends(get_current_user)):
    """Set the theme used everywhere a word of this language is shown. A language is shared by
    all projects, so the theme applies to all of them.

    **Permissions:** admin | can_access_attached_tribes
    """
    pool = get_database()
    return await service.update_language_theme(pool, code, data, current_user["id"])


@router.get("/words", response_model=List[WordSummary])
@require_any_permission_decorator(*_PERMISSIONS)
async def search_words(
    search: str = "", language: Optional[str] = None, current_user: dict = Depends(get_current_user),
):
    """Search the shared dictionary by text, optionally filtered by language.

    **Permissions:** admin | can_access_attached_tribes
    """
    pool = get_database()
    return await service.search_words(pool, search, language)


@router.post(
    "/projects/{project_id}/lessons", response_model=LessonResponse, status_code=status.HTTP_201_CREATED,
)
@require_any_permission_decorator(*_PERMISSIONS)
async def create_lesson(project_id: str, data: LessonCreate, current_user: dict = Depends(get_current_user)):
    """Create a new lesson in the project's shared language knowledge base.

    **Permissions:** admin | can_access_attached_tribes
    **Feature access:** minimum position >= guest
    """
    pool = get_database()
    project_id = await resolve_url_param_id(pool, "projects", project_id)
    await check_project_access_or_admin(project_id, current_user, pool, "guest")
    return await service.create_lesson(pool, project_id, data, current_user["id"])


@router.patch("/lessons/{lesson_id}", response_model=LessonResponse)
@require_any_permission_decorator(*_PERMISSIONS)
async def update_lesson(lesson_id: str, data: LessonUpdate, current_user: dict = Depends(get_current_user)):
    """Update a lesson's title and/or free-text content.

    **Permissions:** admin | can_access_attached_tribes
    **Feature access:** minimum position >= guest
    """
    pool = get_database()
    await access.check_lesson_access(pool, lesson_id, current_user, "guest")
    return await service.update_lesson(pool, lesson_id, data, current_user["id"])


@router.get("/lessons/{lesson_id}/document/revisions", response_model=List[DocumentRevision])
@require_any_permission_decorator(*_PERMISSIONS)
async def get_lesson_document_revisions(lesson_id: str, current_user: dict = Depends(get_current_user)):
    """List a lesson's document revision history.

    **Permissions:** admin | can_access_attached_tribes
    **Feature access:** minimum position >= guest
    """
    pool = get_database()
    await access.check_lesson_access(pool, lesson_id, current_user, "guest")
    return await service.get_lesson_document_revisions(pool, lesson_id)


@router.get("/words/{word_id}", response_model=WordResponse)
@require_any_permission_decorator(*_PERMISSIONS)
async def get_word(word_id: str, current_user: dict = Depends(get_current_user)):
    """Read a word of the shared dictionary with its translations and declensions.

    **Permissions:** admin | can_access_attached_tribes
    """
    pool = get_database()
    return await service.get_word(pool, word_id)


@router.patch("/words/{word_id}", response_model=WordResponse)
@require_any_permission_decorator(*_PERMISSIONS)
async def update_word(word_id: str, data: WordUpdate, current_user: dict = Depends(get_current_user)):
    """Update a word's own fields (text, type, article, plural, declensions) in the shared
    dictionary. Its translation links are unchanged.

    **Permissions:** admin | can_access_attached_tribes
    """
    pool = get_database()
    return await service.update_word(pool, word_id, data, current_user["id"])


@router.post("/words/{word_id}/translations", response_model=WordResponse, status_code=status.HTTP_201_CREATED)
@require_any_permission_decorator(*_PERMISSIONS)
async def add_translation(word_id: str, data: WordTranslationInput, current_user: dict = Depends(get_current_user)):
    """Link a translation to an existing word — either an existing dictionary word or a
    brand-new one created on the spot.

    **Permissions:** admin | can_access_attached_tribes
    """
    pool = get_database()
    return await service.add_translation(pool, word_id, data, current_user["id"])


@router.post(
    "/lessons/{lesson_id}/words/{word_id}", response_model=LessonWordLink,
    status_code=status.HTTP_201_CREATED,
)
@require_any_permission_decorator(*_PERMISSIONS)
async def add_existing_word(lesson_id: str, word_id: str, current_user: dict = Depends(get_current_user)):
    """Add a word already in the shared dictionary to this lesson.

    **Permissions:** admin | can_access_attached_tribes
    **Feature access:** minimum position >= guest
    """
    pool = get_database()
    await access.check_lesson_access(pool, lesson_id, current_user, "guest")
    return await service.add_existing_word_to_lesson(pool, lesson_id, word_id, current_user["id"])


@router.delete("/lessons/{lesson_id}/words/{word_id}", status_code=status.HTTP_204_NO_CONTENT)
@require_any_permission_decorator(*_PERMISSIONS)
async def remove_word(lesson_id: str, word_id: str, current_user: dict = Depends(get_current_user)):
    """Detach a word from this lesson. The word stays in the shared dictionary.

    **Permissions:** admin | can_access_attached_tribes
    **Feature access:** minimum position >= guest
    """
    pool = get_database()
    await access.check_lesson_access(pool, lesson_id, current_user, "guest")
    await service.remove_word_from_lesson(pool, lesson_id, word_id, current_user["id"])


@router.post("/lessons/{lesson_id}/words", response_model=WordResponse, status_code=status.HTTP_201_CREATED)
@require_any_permission_decorator(*_PERMISSIONS)
async def create_word(lesson_id: str, data: WordCreate, current_user: dict = Depends(get_current_user)):
    """Create a brand-new word with its translation, add it to the shared dictionary and
    to this lesson in one step.

    **Permissions:** admin | can_access_attached_tribes
    **Feature access:** minimum position >= guest
    """
    pool = get_database()
    await access.check_lesson_access(pool, lesson_id, current_user, "guest")
    return await service.create_word_for_lesson(pool, lesson_id, data, current_user["id"])


@router.get("/translate-suggestion", response_model=TranslationSuggestion)
@require_any_permission_decorator(*_PERMISSIONS)
async def translate_suggestion(
    text: str, source_language: str, target_language: str, current_user: dict = Depends(get_current_user),
):
    """Get a best-effort translation suggestion from the local dict.cc dictionary.

    **Permissions:** admin | can_access_attached_tribes
    """
    return await service.get_translation_suggestion(text, source_language, target_language)


@router.get("/translate-suggestion/online", response_model=OnlineTranslationSuggestion)
@require_any_permission_decorator(*_PERMISSIONS)
async def translate_suggestion_online(
    text: str, source_language: str, target_language: str, current_user: dict = Depends(get_current_user),
):
    """Get a machine translation from the online service (DeepL), only on explicit request when
    the local dictionary has no match. The typed text is sent to that service.

    **Permissions:** admin | can_access_attached_tribes
    """
    return await service.get_online_translation_suggestion(text, source_language, target_language)


@router.get("/dictionary-words", response_model=List[DictionaryWordMatch])
@require_any_permission_decorator(*_PERMISSIONS)
async def search_dictionary_words(
    language: str, other_language: str, prefix: str, current_user: dict = Depends(get_current_user),
):
    """Same-language autocomplete from the local dict.cc dictionary: words whose text
    starts with the given prefix, independent of translation.

    **Permissions:** admin | can_access_attached_tribes
    """
    return await service.search_dictionary_words(language, other_language, prefix)
