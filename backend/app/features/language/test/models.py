from typing import Optional

from pydantic import BaseModel, model_validator

from app.features.language.score_models import Direction, Mode


class TestAnswerSubmit(BaseModel):
    word_id: str
    direction: Direction
    mode: Mode
    answer: Optional[str] = None
    chosen_word_id: Optional[str] = None

    @model_validator(mode="after")
    def validate_payload(self):
        if self.direction in ("article", "plural"):
            if not self.answer:
                raise ValueError("answer is required for an article or plural test.")
            return self
        if self.mode == "free" and not self.answer:
            raise ValueError("answer is required for free mode.")
        if self.mode == "choice" and not self.chosen_word_id:
            raise ValueError("chosen_word_id is required for choice mode.")
        return self


class TestAnswerResult(BaseModel):
    correct: bool
    correct_answer: str
    word_score: float
