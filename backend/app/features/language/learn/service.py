from app.features.language import dictionary, lessons
from app.features.language.learn.models import DocumentContent, LessonLearnResponse
from app.platform.core.utils.db_helpers import get_document_by_id


async def get_lesson_for_learning(pool, lesson_id: str) -> LessonLearnResponse:
    lesson = await lessons.get_lesson(pool, lesson_id)
    document = await get_document_by_id(pool, "documents", lesson["document_id"], "Document")
    word_entries = await lessons.list_lesson_word_ids(pool, lesson_id)
    words = [await dictionary.get_word_with_translations(pool, entry["id"]) for entry in word_entries]
    return LessonLearnResponse(
        id=lesson["id"],
        title=lesson["title"],
        document=DocumentContent(id=document["id"], content=document.get("content_html") or ""),
        words=words,
    )


async def get_learned_language(pool, lesson_id: str) -> dict | None:
    """Code and (default) name of the language the lesson's project is learning (its target language)."""
    lesson = await lessons.get_lesson(pool, lesson_id)
    settings = await lessons.get_language_settings(pool, lesson["project_id"])
    if settings is None:
        return None
    languages = await lessons.list_languages(pool)
    return next((lang for lang in languages if lang["code"] == settings["target_language"]), None)
