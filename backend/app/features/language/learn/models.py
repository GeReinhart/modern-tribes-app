from typing import List

from pydantic import BaseModel

from app.features.language.schemas import WordResponse


class DocumentContent(BaseModel):
    id: str
    content: str


class LessonLearnResponse(BaseModel):
    id: str
    title: str
    document: DocumentContent
    words: List[WordResponse]
