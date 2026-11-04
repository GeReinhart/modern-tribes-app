from fastapi import HTTPException

from app.features.language import dictionary, lesson_score, lessons
from app.features.language.test import repository
from app.features.language.test.models import TestAnswerResult, TestAnswerSubmit


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
    return await lesson_score.current_word_score(pool, lesson_id, scored_word_id, user_id)


async def _word_id_to_score(pool, lesson_id: str, data: TestAnswerSubmit) -> str:
    """In the reverse and article directions the submitted word is the translation shown to
    the user; the score returned is the one of the lesson word it translates (the submitted
    word otherwise)."""
    if data.direction in ("target_to_source", "article", "plural"):
        lesson_word_id = await repository.find_lesson_word_for_translation(pool, lesson_id, data.word_id)
        if lesson_word_id:
            return lesson_word_id
    return data.word_id


async def _check_choice_mode_available(pool, lesson_id: str, word: dict) -> None:
    lesson_words = await lessons.list_lesson_word_ids(pool, lesson_id)
    same_type_count = sum(1 for w in lesson_words if w["word_type"] == word["word_type"])
    if same_type_count < 4:
        raise HTTPException(
            status_code=422,
            detail="At least 4 words of the same type are needed in the lesson for multiple-choice testing.",
        )
