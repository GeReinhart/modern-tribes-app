from datetime import date, timedelta

from fastapi import HTTPException

from app.features.language import access, dictionary, lessons
from app.features.language.test import repository, scoring
from app.features.language.test.models import (
    LessonScoreResponse, ScoreHistoryPoint, ScoreHistoryResponse, TestAnswerResult, TestAnswerSubmit, TestMember, WordAttempt, WordScore,
)


async def submit_answer(pool, lesson_id: str, data: TestAnswerSubmit, user_id: str) -> TestAnswerResult:
    word = await dictionary.get_word(pool, data.word_id)
    if word is None:
        raise HTTPException(status_code=404, detail="Word not found")
    if data.direction in ("article", "plural"):
        correct, correct_answer = _check_noun_fact_answer(word, data.direction, data.answer)
    else:
        correct, correct_answer = await _check_translation_answer(pool, lesson_id, word, data)

    await repository.record_attempt(pool, user_id, data.word_id, data.direction, data.mode, correct)
    score = await _score_after_attempt(pool, lesson_id, data, user_id)
    return TestAnswerResult(correct=correct, correct_answer=correct_answer, word_score=round(score, 4))


def _check_noun_fact_answer(word: dict, fact: str, answer: str) -> tuple[bool, str]:
    """`fact` is "article" or "plural": the noun's own value for it is the right answer."""
    expected = (word.get(fact) or "").strip()
    if word["word_type"] != "noun" or not expected:
        raise HTTPException(status_code=422, detail=f"This word has no {fact} to test.")
    return answer.strip().lower() == expected.lower(), expected


async def _check_translation_answer(pool, lesson_id: str, word: dict, data: TestAnswerSubmit) -> tuple[bool, str]:
    translations = await dictionary.get_translations(pool, data.word_id)
    if not translations:
        raise HTTPException(status_code=422, detail="This word has no translation yet.")
    if data.mode == "choice":
        await _check_choice_mode_available(pool, lesson_id, word)
        correct = data.chosen_word_id in {t["id"] for t in translations}
    else:
        correct = data.answer.strip().lower() in {t["text"].strip().lower() for t in translations}
    return correct, translations[0]["text"]


async def _score_after_attempt(pool, lesson_id: str, data: TestAnswerSubmit, user_id: str) -> float:
    scored_word_id = await _word_id_to_score(pool, lesson_id, data)
    attempts = await repository.get_word_attempts(pool, user_id, scored_word_id)
    has_article, has_plural = await _noun_facts(pool, await _target_language(pool, lesson_id), scored_word_id)
    return scoring.word_score(attempts, date.today(), has_article, has_plural)


async def _word_id_to_score(pool, lesson_id: str, data: TestAnswerSubmit) -> str:
    """In the reverse and article directions the submitted word is the translation shown to
    the user; the score returned is the one of the lesson word it translates (the submitted
    word otherwise)."""
    if data.direction in ("target_to_source", "article", "plural"):
        lesson_word_id = await repository.find_lesson_word_for_translation(pool, lesson_id, data.word_id)
        if lesson_word_id:
            return lesson_word_id
    return data.word_id


async def _target_language(pool, lesson_id: str) -> str | None:
    project_id = await access.get_lesson_project_id(pool, lesson_id)
    settings = await lessons.get_language_settings(pool, project_id)
    return settings["target_language"] if settings else None


async def _noun_facts(pool, target_language: str | None, lesson_word_id: str) -> tuple[bool, bool]:
    """Whether the lesson word is also tested on an article and on a plural, i.e. it (or its
    translation) is a learned-language noun that has one."""
    if target_language is None:
        return False, False
    has_article = await repository.find_noun_entry(pool, lesson_word_id, target_language, "article")
    has_plural = await repository.find_noun_entry(pool, lesson_word_id, target_language, "plural")
    return has_article is not None, has_plural is not None


async def _check_choice_mode_available(pool, lesson_id: str, word: dict) -> None:
    lesson_words = await lessons.list_lesson_word_ids(pool, lesson_id)
    same_type_count = sum(1 for w in lesson_words if w["word_type"] == word["word_type"])
    if same_type_count < 4:
        raise HTTPException(
            status_code=422,
            detail="At least 4 words of the same type are needed in the lesson for multiple-choice testing.",
        )


async def get_lesson_score(pool, lesson_id: str, user_id: str) -> LessonScoreResponse:
    lesson_words = await lessons.list_lesson_word_ids(pool, lesson_id)
    today = date.today()
    target_language = await _target_language(pool, lesson_id)
    scores = [await _score_for_word(pool, entry["id"], user_id, today, target_language) for entry in lesson_words]
    overall = round(sum(s.score for s in scores) / len(scores), 4) if scores else 0.0
    return LessonScoreResponse(overall_score=overall, words=scores)


async def _score_for_word(pool, word_id: str, user_id: str, today: date, target_language: str | None) -> WordScore:
    attempts = await repository.get_word_attempts(pool, user_id, word_id)
    has_article, has_plural = await _noun_facts(pool, target_language, word_id)
    return WordScore(
        word_id=word_id,
        score=round(scoring.word_score(attempts, today, has_article, has_plural), 4),
        attempts=[WordAttempt(**a) for a in attempts],
    )


async def list_members(pool, lesson_id: str) -> list[TestMember]:
    project_id = await access.get_lesson_project_id(pool, lesson_id)
    return [TestMember(**row) for row in await repository.list_project_members(pool, project_id)]


async def resolve_score_user(pool, lesson_id: str, requested_user_id: str | None, current_user_id: str) -> str:
    """The user whose results are shown: the requested project member, else the signed-in user."""
    if requested_user_id is None or requested_user_id == current_user_id:
        return current_user_id
    members = await list_members(pool, lesson_id)
    if requested_user_id not in {m.user_id for m in members}:
        raise HTTPException(status_code=404, detail="Member not found")
    return requested_user_id


async def get_score_history(pool, lesson_id: str, user_id: str) -> ScoreHistoryResponse:
    """The lesson's overall score at the end of each day, from the first answer until today."""
    lesson_words = await lessons.list_lesson_word_ids(pool, lesson_id)
    target_language = await _target_language(pool, lesson_id)
    words = [await _word_history_input(pool, entry["id"], user_id, target_language) for entry in lesson_words]
    first_day = min((a["created_at"].date() for attempts, _, _ in words for a in attempts), default=None)
    if first_day is None:
        return ScoreHistoryResponse(points=[])
    days = [first_day + timedelta(days=n) for n in range((date.today() - first_day).days + 1)]
    return ScoreHistoryResponse(points=[_history_point(words, day) for day in days])


async def _word_history_input(pool, word_id: str, user_id: str, target_language: str | None):
    attempts = await repository.get_word_attempts(pool, user_id, word_id)
    has_article, has_plural = await _noun_facts(pool, target_language, word_id)
    return attempts, has_article, has_plural


def _history_point(words: list, day: date) -> ScoreHistoryPoint:
    scores = [
        scoring.word_score([a for a in attempts if a["created_at"].date() <= day], day, has_article, has_plural)
        for attempts, has_article, has_plural in words
    ]
    return ScoreHistoryPoint(date=day, score=round(sum(scores) / len(scores), 4))
