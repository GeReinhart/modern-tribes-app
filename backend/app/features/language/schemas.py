"""Word representation shared by every sub-package that reads or writes the dictionary
(lesson, to return a word it just created; learn, to display a lesson's word list)."""
from typing import List, Optional

from pydantic import BaseModel


class DeclensionItem(BaseModel):
    case_label: str
    form: str


class TranslationWordResponse(BaseModel):
    id: str
    text: str
    language: str
    word_type: str
    article: Optional[str] = None
    plural: Optional[str] = None
    declensions: List[DeclensionItem] = []


class WordResponse(BaseModel):
    id: str
    text: str
    language: str
    word_type: str
    article: Optional[str] = None
    plural: Optional[str] = None
    declensions: List[DeclensionItem] = []
    translations: List[TranslationWordResponse] = []


class WordSummary(BaseModel):
    id: str
    text: str
    language: str
    word_type: str


class LanguageInfo(BaseModel):
    code: str
    name: str
    theme_code: Optional[str] = None


class LanguageThemeUpdate(BaseModel):
    theme_code: Optional[str] = None


class WordUpdate(BaseModel):
    text: str
    word_type: str
    article: Optional[str] = None
    plural: Optional[str] = None
    declensions: List[DeclensionItem] = []
