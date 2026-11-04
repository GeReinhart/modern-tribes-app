from datetime import date, datetime
from typing import List, Literal, Optional

from pydantic import BaseModel, model_validator

Direction = Literal["source_to_target", "target_to_source", "article", "plural"]
Mode = Literal["free", "choice"]


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


class WordAttempt(BaseModel):
    direction: Direction
    mode: Mode
    correct: bool
    created_at: datetime


class ScoreHistoryPoint(BaseModel):
    date: date
    score: float


class ScoreHistoryResponse(BaseModel):
    points: List[ScoreHistoryPoint]


class EffortDay(BaseModel):
    date: date
    success: float
    errors: float


class EffortResponse(BaseModel):
    days: List[EffortDay]


class CompetitionMember(BaseModel):
    user_id: str
    name: str
    points: List[ScoreHistoryPoint]


class CompetitionResponse(BaseModel):
    members: List[CompetitionMember]


class WordScore(BaseModel):
    word_id: str
    score: float
    attempts: List[WordAttempt] = []


class TestMember(BaseModel):
    user_id: str
    name: str


class LessonScoreResponse(BaseModel):
    overall_score: float
    words: List[WordScore]
