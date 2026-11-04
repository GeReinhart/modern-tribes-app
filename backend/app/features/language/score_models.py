"""The lesson score as returned to the app, shared by the test (own score) and result (any member's score)."""
from datetime import datetime
from typing import List, Literal

from pydantic import BaseModel

Direction = Literal["source_to_target", "target_to_source", "article", "plural"]
Mode = Literal["free", "choice"]


class WordAttempt(BaseModel):
    direction: Direction
    mode: Mode
    correct: bool
    created_at: datetime


class WordScore(BaseModel):
    word_id: str
    score: float
    attempts: List[WordAttempt] = []


class LessonScoreResponse(BaseModel):
    overall_score: float
    words: List[WordScore]
