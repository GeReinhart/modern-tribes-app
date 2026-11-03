from datetime import datetime
from typing import List, Optional

from pydantic import BaseModel, model_validator

from app.features.language.schemas import (  # noqa: F401 — re-exported
    DeclensionItem, LanguageInfo, LanguageThemeUpdate, WordResponse, WordSummary, WordUpdate,
)


class LanguageSettingsCreate(BaseModel):
    source_language: str
    target_language: str


class LanguageSettingsResponse(BaseModel):
    project_id: str
    source_language: str
    target_language: str


class LessonCreate(BaseModel):
    title: str


class LessonUpdate(BaseModel):
    title: Optional[str] = None
    document_content_html: Optional[str] = None


class LessonResponse(BaseModel):
    id: str
    project_id: str
    title: str
    word_count: int
    created_at: datetime
    updated_at: datetime


class WordTranslationInput(BaseModel):
    word_id: Optional[str] = None
    text: Optional[str] = None
    language: Optional[str] = None
    word_type: Optional[str] = None
    article: Optional[str] = None
    plural: Optional[str] = None
    declensions: List[DeclensionItem] = []

    @model_validator(mode="after")
    def validate_source(self):
        """A translation is either an existing dictionary word (by id), or a brand-new
        one (text, language and word_type)."""
        if self.word_id or (self.text and self.language and self.word_type):
            return self
        raise ValueError("Provide either word_id, or text, language and word_type.")


class WordCreate(BaseModel):
    text: str
    language: str
    word_type: str
    article: Optional[str] = None
    plural: Optional[str] = None
    declensions: List[DeclensionItem] = []
    translations: List[WordTranslationInput]


class LessonWordLink(BaseModel):
    lesson_id: str
    word_id: str
    text: str


class TranslationCandidate(BaseModel):
    text: str
    article: Optional[str] = None
    context: Optional[str] = None
    word_type: Optional[str] = None
    source_article: Optional[str] = None
    # Plural of the translation / of the typed word, when the dictionary lists it.
    plural: Optional[str] = None
    source_plural: Optional[str] = None


class TranslationSuggestion(BaseModel):
    text: str
    source_language: str
    target_language: str
    suggestions: List[TranslationCandidate] = []


class OnlineTranslationSuggestion(TranslationSuggestion):
    source: str = "online"


class DictionaryWordMatch(BaseModel):
    text: str
    word_type: Optional[str] = None
    article: Optional[str] = None
