import asyncio

from fastapi import HTTPException

from app.features.language import dictionary, lessons
from app.features.language.lesson import local_dictionary, online_translation
from app.features.language.lesson.models import (
    DictionaryWordMatch, LanguageInfo, LanguageSettingsCreate, LanguageSettingsResponse,
    LanguageThemeUpdate, LessonCreate, OnlineTranslationSuggestion, LessonResponse, LessonUpdate, LessonWordLink, TranslationCandidate,
    TranslationSuggestion, WordCreate, WordResponse, WordSummary, WordTranslationInput, WordUpdate,
)
from app.platform.core.uploads.helpers import create_document_with_attachments
from app.platform.core.utils.document_helpers import fetch_document_revisions, update_document_content_with_revision


async def set_language_pair(
    pool, project_id: str, data: LanguageSettingsCreate, user_id: str,
) -> LanguageSettingsResponse:
    if await lessons.get_language_settings(pool, project_id):
        raise HTTPException(status_code=409, detail="This project already has a language pair set.")
    if data.source_language == data.target_language:
        raise HTTPException(status_code=422, detail="Source and target languages must differ.")
    for code in (data.source_language, data.target_language):
        if not await lessons.language_code_exists(pool, code):
            raise HTTPException(status_code=422, detail=f"Unknown language code: {code}")
    row = await lessons.create_language_settings(
        pool, project_id, data.source_language, data.target_language, user_id,
    )
    return LanguageSettingsResponse(**row)


async def create_lesson(pool, project_id: str, data: LessonCreate, user_id: str) -> LessonResponse:
    if not await lessons.get_language_settings(pool, project_id):
        raise HTTPException(status_code=422, detail="Set this project's language pair before adding a lesson.")
    document = await create_document_with_attachments(pool, "", None, user_id)
    row = await lessons.create_lesson(pool, project_id, data.title, document["id"], user_id)
    return LessonResponse(
        id=row["id"], project_id=row["project_id"], title=row["title"],
        word_count=0, created_at=row["created_at"], updated_at=row["updated_at"],
    )


async def list_lessons(pool, project_id: str) -> list[LessonResponse]:
    rows = await lessons.list_lessons_for_project(pool, project_id)
    return [await _lesson_response(pool, row) for row in rows]


async def _lesson_response(pool, row: dict) -> LessonResponse:
    word_count = await lessons.count_lesson_words(pool, row["id"])
    return LessonResponse(
        id=row["id"], project_id=row["project_id"], title=row["title"],
        word_count=word_count, created_at=row["created_at"], updated_at=row["updated_at"],
    )


async def get_language_settings(pool, project_id: str) -> LanguageSettingsResponse | None:
    row = await lessons.get_language_settings(pool, project_id)
    return LanguageSettingsResponse(**row) if row else None


async def search_words(pool, query: str, language: str | None) -> list[WordSummary]:
    rows = await dictionary.search_words(pool, query, language)
    return [WordSummary(**row) for row in rows]


async def list_languages(pool) -> list[LanguageInfo]:
    rows = await lessons.list_languages(pool)
    return [LanguageInfo(**row) for row in rows]


async def update_language_theme(pool, code: str, data: LanguageThemeUpdate, user_id: str) -> LanguageInfo:
    row = await lessons.update_language_theme(pool, code, data.theme_code, user_id)
    if row is None:
        raise HTTPException(status_code=404, detail="Language not found")
    return LanguageInfo(**row)


async def get_word(pool, word_id: str) -> WordResponse:
    if await dictionary.get_word(pool, word_id) is None:
        raise HTTPException(status_code=404, detail="Word not found")
    return WordResponse(**await dictionary.get_word_with_translations(pool, word_id))


async def update_word(pool, word_id: str, data: WordUpdate, user_id: str) -> WordResponse:
    word = await dictionary.get_word(pool, word_id)
    if word is None:
        raise HTTPException(status_code=404, detail="Word not found")
    if data.text.lower() != word["text"].lower():
        existing = await dictionary.find_active_word_by_text(pool, data.text, word["language"])
        if existing and existing["id"] != word_id:
            raise HTTPException(status_code=409, detail="This word already exists for that language.")
    await dictionary.update_word(pool, word_id, data.text, data.word_type, data.article, data.plural, user_id)
    await dictionary.replace_declensions(pool, word_id, [d.model_dump() for d in data.declensions], user_id)
    return WordResponse(**await dictionary.get_word_with_translations(pool, word_id))


async def update_lesson(pool, lesson_id: str, data: LessonUpdate, user_id: str) -> LessonResponse:
    lesson = await lessons.get_lesson(pool, lesson_id)
    if lesson is None:
        raise HTTPException(status_code=404, detail="Lesson not found")
    if data.title is not None:
        await lessons.update_lesson_title(pool, lesson_id, data.title, user_id)
    if data.document_content_html is not None:
        await update_document_content_with_revision(
            pool, lesson["document_id"], data.document_content_html, user_id,
        )
    return await _lesson_response(pool, await lessons.get_lesson(pool, lesson_id))


async def get_lesson_document_revisions(pool, lesson_id: str) -> list[dict]:
    lesson = await lessons.get_lesson(pool, lesson_id)
    if lesson is None or not lesson.get("document_id"):
        return []
    return await fetch_document_revisions(pool, lesson["document_id"])


async def add_existing_word_to_lesson(pool, lesson_id: str, word_id: str, user_id: str) -> LessonWordLink:
    word = await dictionary.get_word(pool, word_id)
    if word is None:
        raise HTTPException(status_code=404, detail="Word not found")
    if await lessons.is_word_in_lesson(pool, lesson_id, word_id):
        raise HTTPException(status_code=409, detail="This word is already in the lesson.")
    await lessons.add_word_to_lesson(pool, lesson_id, word_id, user_id)
    return LessonWordLink(lesson_id=lesson_id, word_id=word_id, text=word["text"])


async def remove_word_from_lesson(pool, lesson_id: str, word_id: str, user_id: str) -> None:
    if not await lessons.is_word_in_lesson(pool, lesson_id, word_id):
        raise HTTPException(status_code=404, detail="This word is not in the lesson.")
    await lessons.remove_word_from_lesson(pool, lesson_id, word_id, user_id)


async def create_word_for_lesson(pool, lesson_id: str, data: WordCreate, user_id: str) -> WordResponse:
    if await dictionary.find_active_word_by_text(pool, data.text, data.language):
        raise HTTPException(status_code=409, detail="This word already exists for that language.")
    word = await dictionary.create_word(
        pool, data.text, data.language, data.word_type, data.article, data.plural, user_id,
    )
    await dictionary.create_declensions(pool, word["id"], [d.model_dump() for d in data.declensions], user_id)
    for translation in data.translations:
        translation_word_id = await _resolve_translation_word(pool, translation, user_id)
        await dictionary.link_translation(pool, word["id"], translation_word_id, user_id)
    await lessons.add_word_to_lesson(pool, lesson_id, word["id"], user_id)
    return WordResponse(**await dictionary.get_word_with_translations(pool, word["id"]))


async def add_translation(pool, word_id: str, translation: WordTranslationInput, user_id: str) -> WordResponse:
    word = await dictionary.get_word(pool, word_id)
    if word is None:
        raise HTTPException(status_code=404, detail="Word not found")
    translation_word_id = await _resolve_translation_word(pool, translation, user_id)
    if translation_word_id == word_id:
        raise HTTPException(status_code=422, detail="A word cannot be its own translation.")
    existing_translations = await dictionary.get_translations(pool, word_id)
    if any(t["id"] == translation_word_id for t in existing_translations):
        raise HTTPException(status_code=409, detail="This translation is already linked.")
    await dictionary.link_translation(pool, word_id, translation_word_id, user_id)
    return WordResponse(**await dictionary.get_word_with_translations(pool, word_id))


async def _resolve_translation_word(pool, translation: WordTranslationInput, user_id: str) -> str:
    """An existing word is reused by id or by matching text; otherwise a new one is
    created — the global dictionary never ends up with two active words for the same
    (text, language)."""
    if translation.word_id:
        word = await dictionary.get_word(pool, translation.word_id)
        if word is None:
            raise HTTPException(status_code=404, detail="Translation word not found")
        return word["id"]
    existing = await dictionary.find_active_word_by_text(pool, translation.text, translation.language)
    if existing:
        return existing["id"]
    word = await dictionary.create_word(
        pool, translation.text, translation.language, translation.word_type,
        translation.article, translation.plural, user_id,
    )
    await dictionary.create_declensions(pool, word["id"], [d.model_dump() for d in translation.declensions], user_id)
    return word["id"]


async def get_translation_suggestion(
    text: str, source_language: str, target_language: str,
) -> TranslationSuggestion:
    candidates = await asyncio.to_thread(
        local_dictionary.suggest_translations, source_language, target_language, text,
    )
    return TranslationSuggestion(
        text=text, source_language=source_language, target_language=target_language,
        suggestions=[
            TranslationCandidate(
                text=c.text, article=c.article, context=c.context, word_type=c.word_type,
                source_article=c.source_article, plural=c.plural, source_plural=c.source_plural,
            )
            for c in candidates
        ],
    )


async def get_online_translation_suggestion(
    text: str, source_language: str, target_language: str,
) -> OnlineTranslationSuggestion:
    """A single machine translation: unlike the dictionary it carries no article, plural or type."""
    translated = await online_translation.translate_word(text, source_language, target_language)
    return OnlineTranslationSuggestion(
        text=text, source_language=source_language, target_language=target_language,
        suggestions=[TranslationCandidate(text=translated)],
    )


async def search_dictionary_words(
    language: str, other_language: str, prefix: str,
) -> list[DictionaryWordMatch]:
    matches = await asyncio.to_thread(
        local_dictionary.search_words_by_prefix, language, other_language, language, prefix,
    )
    return [DictionaryWordMatch(text=m.text, word_type=m.word_type, article=m.article) for m in matches]
