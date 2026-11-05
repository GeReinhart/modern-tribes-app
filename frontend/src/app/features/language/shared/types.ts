// Mirrors the backend's `word_type` string column (see backend/app/features/language/schemas.py).
// Kept as a small string union rather than a TS enum, matching the convention already used for
// similar backend-mirrored string sets in this app (see frontend/src/types/groceries.ts).
export type WordType = 'noun' | 'adjective' | 'verb' | 'other';
export const WORD_TYPES: readonly WordType[] = ['noun', 'adjective', 'verb', 'other'];

export interface Declension {
  case_label: string;
  form: string;
}

export interface WordSummary {
  id: string;
  text: string;
  language: string;
  word_type: WordType;
}

export interface TranslationWord {
  id: string;
  text: string;
  language: string;
  word_type: WordType;
  article?: string | null;
  plural?: string | null;
  declensions: Declension[];
}

export interface Word {
  id: string;
  text: string;
  language: string;
  word_type: WordType;
  article?: string | null;
  plural?: string | null;
  declensions: Declension[];
  translations: TranslationWord[];
}

export interface Language {
  code: string;
  name: string;
  theme_code: string | null;
}

export interface LanguageSettings {
  project_id: string;
  source_language: string;
  target_language: string;
}

export interface LanguageSettingsCreate {
  source_language: string;
  target_language: string;
}

export interface Lesson {
  id: string;
  project_id: string;
  title: string;
  word_count: number;
  created_at: string;
  updated_at: string;
}

export interface LessonUpdate {
  title?: string;
  document_content_html?: string;
}

export interface LessonDocument {
  id: string;
  content: string;
}

export interface LessonDetail {
  id: string;
  title: string;
  document: LessonDocument;
  words: Word[];
}

export interface TranslationInput {
  word_id?: string;
  text?: string;
  language?: string;
  word_type?: WordType;
  article?: string;
  plural?: string;
  declensions?: Declension[];
}

export interface WordCreateInput {
  text: string;
  language: string;
  word_type: WordType;
  article?: string;
  plural?: string;
  declensions?: Declension[];
  translations: TranslationInput[];
}

// `language` is never editable, so it is deliberately not part of this shape (see
// backend/app/features/language/dictionary.py -- a word's language is fixed at creation).
export interface WordUpdateInput {
  text: string;
  word_type: WordType;
  article?: string;
  plural?: string;
  declensions?: Declension[];
}

// One dict.cc sense of a headword -- a single word commonly has several (see
// backend/app/features/language/lesson/local_dictionary.py), so the caller shows every
// candidate and lets the user pick the one they meant instead of guessing.
// `text`/`article`/`context` describe the OTHER column's translation (the manual "Suggest
// translation" flow, cross-language, exact-match on the fully typed word). `word_type`/
// `source_article` describe the TYPED word's own grammar instead (same dict.cc entry, same
// language as the typed word), but are not currently surfaced in the UI -- the same-language,
// prefix-based autocomplete shown while typing uses the separate `/dictionary-words` endpoint
// instead (see DictionaryWordMatch, useDictionaryAutocomplete).
export interface TranslationCandidate {
  text: string;
  article: string | null;
  context: string | null;
  word_type: WordType | null;
  source_article: string | null;
  // Plural of the translation / of the typed word, when the dictionary lists it.
  plural: string | null;
  source_plural: string | null;
}

export interface TranslationSuggestion {
  text: string;
  source_language: string;
  target_language: string;
  suggestions: TranslationCandidate[];
}

// A dict.cc word in the column's OWN language whose text starts with the typed prefix --
// same-language autocomplete, independent of translation (see
// backend/app/features/language/lesson/local_dictionary.py `search_words_by_prefix`).
export interface DictionaryWordMatch {
  text: string;
  word_type: WordType | null;
  article: string | null;
}
