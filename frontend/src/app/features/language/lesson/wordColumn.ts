import {
  Declension, TranslationCandidate, TranslationInput, WordCreateInput, WordSummary, WordType, WordUpdateInput,
} from '../shared/types.ts';

// One column of the two-column word form: either a brand-new word's fields (`wordId: null`),
// or a reused existing word picked from the dropdown (`wordId` set -- its own fields are then
// locked, since a reused word is sent by reference, not re-described).
export interface WordColumnState {
  wordId: string | null;
  text: string;
  language: string;
  wordType: WordType;
  article: string;
  plural: string;
  declensions: Declension[];
}

interface WordLike {
  id: string;
  text: string;
  word_type: WordType;
  article?: string | null;
  plural?: string | null;
  declensions: Declension[];
}

export function createEmptyColumn(language: string): WordColumnState {
  return { wordId: null, text: '', language, wordType: 'noun', article: '', plural: '', declensions: [] };
}

// Pre-fills a column from a word that is already fully known (editing a word or its
// translation in place) -- article/plural/declensions are the real, current ones.
export function columnFromWord(word: WordLike, language: string): WordColumnState {
  return {
    wordId: word.id, text: word.text, language, wordType: word.word_type,
    article: word.article ?? '', plural: word.plural ?? '', declensions: word.declensions,
  };
}

// A dictionary search result only carries a summary -- article/plural/declensions aren't
// known, and aren't sent anyway once a word is reused by reference instead of re-described.
export function columnFromSummary(summary: WordSummary): WordColumnState {
  return {
    wordId: summary.id, text: summary.text, language: summary.language, wordType: summary.word_type,
    article: '', plural: '', declensions: [],
  };
}

// A picked translation candidate fills the column's text and article, and its plural when the
// dictionary found one (a best-effort match, see local_dictionary.py -- still editable).
export function applyTranslationCandidate(column: WordColumnState, candidate: TranslationCandidate): WordColumnState {
  return { ...column, text: candidate.text, article: candidate.article ?? '', plural: candidate.plural ?? column.plural };
}

// The typed word's own plural, suggested for the column it was typed in unless one is already set.
export function applySourcePlural(column: WordColumnState, candidate: TranslationCandidate): WordColumnState {
  return column.plural.trim() || !candidate.source_plural ? column : { ...column, plural: candidate.source_plural };
}

export function isColumnValid(column: WordColumnState): boolean {
  return Boolean(column.wordId) || column.text.trim().length > 0;
}

function cleanDeclensions(declensions: Declension[]): Declension[] {
  return declensions
    .filter((d) => d.case_label.trim() && d.form.trim())
    .map((d) => ({ case_label: d.case_label.trim(), form: d.form.trim() }));
}

function wordFields(column: WordColumnState) {
  return {
    text: column.text.trim(),
    word_type: column.wordType,
    article: column.article.trim() || undefined,
    plural: column.plural.trim() || undefined,
    declensions: cleanDeclensions(column.declensions),
  };
}

export function toTranslationInput(column: WordColumnState): TranslationInput {
  if (column.wordId) return { word_id: column.wordId };
  return { ...wordFields(column), language: column.language };
}

// The left column is always sent as the primary word's own brand-new fields here -- a reused
// left column is added to the lesson via `addExistingWord` instead (see useLessonWords.ts),
// since there is no endpoint to also attach a translation to an already-existing word.
export function toWordCreateInput(left: WordColumnState, right: WordColumnState): WordCreateInput {
  return { ...wordFields(left), language: left.language, translations: [toTranslationInput(right)] };
}

export function toWordUpdateInput(column: WordColumnState): WordUpdateInput {
  return wordFields(column);
}

export function columnFieldsEqual(a: WordColumnState, b: WordColumnState): boolean {
  if (a.text.trim() !== b.text.trim() || a.wordType !== b.wordType) return false;
  if (a.article.trim() !== b.article.trim() || a.plural.trim() !== b.plural.trim()) return false;
  const declensionsA = cleanDeclensions(a.declensions);
  const declensionsB = cleanDeclensions(b.declensions);
  if (declensionsA.length !== declensionsB.length) return false;
  return declensionsA.every((d, i) => d.case_label === declensionsB[i].case_label && d.form === declensionsB[i].form);
}
