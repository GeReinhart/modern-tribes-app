from datetime import date
from typing import List

from pydantic import BaseModel


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


class ResultMember(BaseModel):
    user_id: str
    name: str
