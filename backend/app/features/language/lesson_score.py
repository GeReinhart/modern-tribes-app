"""A person's score on a lesson: the average of its words' scores (see scoring.py). Shared by the
test sub-package (the score after an answer, the person's own score) and the result sub-package
(any member's score and its history)."""
from datetime import date

from app.features.language import access, attempts, lessons, scoring
from app.features.language.score_models import LessonScoreResponse, WordAttempt, WordScore


async def target_language(pool, lesson_id: str) -> str | None:
    project_id = await access.get_lesson_project_id(pool, lesson_id)
    settings = await lessons.get_language_settings(pool, project_id)
    return settings["target_language"] if settings else None


async def noun_facts(pool, language: str | None, lesson_word_id: str) -> tuple[bool, bool]:
    """Whether the lesson word is also tested on an article and on a plural, i.e. it (or its
    translation) is a learned-language noun that has one."""
    if language is None:
        return False, False
    has_article = await attempts.find_noun_entry(pool, lesson_word_id, language, "article")
    has_plural = await attempts.find_noun_entry(pool, lesson_word_id, language, "plural")
    return has_article is not None, has_plural is not None


async def word_inputs(pool, word_id: str, user_id: str, language: str | None):
    """What a word's score is computed from: the person's attempts, and whether the word has an article and a plural."""
    word_attempts = await attempts.get_word_attempts(pool, user_id, word_id)
    has_article, has_plural = await noun_facts(pool, language, word_id)
    return word_attempts, has_article, has_plural


async def current_word_score(pool, lesson_id: str, word_id: str, user_id: str) -> float:
    word_attempts, has_article, has_plural = await word_inputs(pool, word_id, user_id, await target_language(pool, lesson_id))
    return scoring.word_score(word_attempts, date.today(), has_article, has_plural)


async def get_lesson_score(pool, lesson_id: str, user_id: str) -> LessonScoreResponse:
    today = date.today()
    scores = [_word_score(word_id, inputs, today) for word_id, inputs in await lesson_word_inputs(pool, lesson_id, user_id)]
    overall = round(sum(s.score for s in scores) / len(scores), 4) if scores else 0.0
    return LessonScoreResponse(overall_score=overall, words=scores)


async def lesson_word_inputs(pool, lesson_id: str, user_id: str) -> list:
    """(word id, `word_inputs`) for each of the lesson's words."""
    lesson_words = await lessons.list_lesson_word_ids(pool, lesson_id)
    language = await target_language(pool, lesson_id)
    return [(entry["id"], await word_inputs(pool, entry["id"], user_id, language)) for entry in lesson_words]


def _word_score(word_id: str, inputs: tuple, today: date) -> WordScore:
    word_attempts, has_article, has_plural = inputs
    return WordScore(
        word_id=word_id,
        score=round(scoring.word_score(word_attempts, today, has_article, has_plural), 4),
        attempts=[WordAttempt(**a) for a in word_attempts],
    )
