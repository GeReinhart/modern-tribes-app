import { Word, WordType } from '../shared/types.ts';
import { Direction, WordScore } from './types.ts';

export interface QuizChoiceOption {
  id: string;
  text: string;
}

export interface QuizPrompt {
  testedWordId: string;
  testedWordType: WordType;
  promptText: string;
  promptLanguage: string;
  answerLanguage: string;
}

const MIN_WORD_WEIGHT = 0.1;

// Quadratic in the missing score, so a poorly known word comes up far more often than a
// half-known one (score 0 -> 1.0, 0.5 -> ~0.33, 1 -> 0.1), while the floor keeps an
// already-mastered word coming back now and then (about 1 time in 10 vs an unknown word).
export function wordWeight(score: number): number {
  const missing = 1 - Math.min(1, Math.max(0, score));
  return MIN_WORD_WEIGHT + (1 - MIN_WORD_WEIGHT) * missing * missing;
}

// Picks a word to test, biased toward lower scores (see wordWeight).
export function pickWeightedWord(words: Word[], scores: WordScore[]): Word | null {
  const scoreByWordId = new Map(scores.map((s) => [s.word_id, s.score]));
  return pickWeighted(words, (w) => wordWeight(scoreByWordId.get(w.id) ?? 0));
}

// Random pick where each item's chance is proportional to its weight.
export function pickWeighted<T>(items: T[], weightOf: (item: T) => number): T | null {
  if (items.length === 0) return null;
  const weights = items.map(weightOf);
  const total = weights.reduce((sum, w) => sum + w, 0);
  let roll = Math.random() * total;
  for (let i = 0; i < items.length; i += 1) {
    roll -= weights[i];
    if (roll <= 0) return items[i];
  }
  return items[items.length - 1];
}

export function pickRandomDirection(): Direction {
  return Math.random() < 0.5 ? 'source_to_target' : 'target_to_source';
}

// `source_to_target`: show the word's own text, expect its translation's text.
// `target_to_source`: show the translation's text, expect the word's own text -- the attempt
// is then submitted against the translation's own id, since the backend always checks the
// submitted word_id's translations for correctness (see backend/app/features/language/test/service.py).
export function buildQuizPrompt(word: Word, direction: Direction): QuizPrompt | null {
  const translation = word.translations[0];
  if (!translation) return null;
  if (direction === 'source_to_target') {
    return {
      testedWordId: word.id, testedWordType: word.word_type,
      promptText: word.text, promptLanguage: word.language, answerLanguage: translation.language,
    };
  }
  return {
    testedWordId: translation.id, testedWordType: translation.word_type,
    promptText: translation.text, promptLanguage: translation.language, answerLanguage: word.language,
  };
}

export function sameTypeCount(words: Word[], wordType: WordType): number {
  return words.filter((w) => w.word_type === wordType).length;
}

export function shuffle<T>(items: T[]): T[] {
  const copy = [...items];
  for (let i = copy.length - 1; i > 0; i -= 1) {
    const j = Math.floor(Math.random() * (i + 1));
    [copy[i], copy[j]] = [copy[j], copy[i]];
  }
  return copy;
}

function dedupeById(options: QuizChoiceOption[]): QuizChoiceOption[] {
  const seenIds = new Set<string>();
  return options.filter((option) => {
    if (seenIds.has(option.id)) return false;
    seenIds.add(option.id);
    return true;
  });
}

function choicePool(lessonWords: Word[], word: Word, direction: Direction, prompt: QuizPrompt): QuizChoiceOption[] {
  if (direction === 'source_to_target') {
    return lessonWords
      .flatMap((w) => w.translations)
      .filter((t) => t.word_type === prompt.testedWordType && t.language === prompt.answerLanguage)
      .map((t) => ({ id: t.id, text: t.text }));
  }
  return lessonWords
    .filter((w) => w.id !== word.id && w.word_type === prompt.testedWordType && w.language === prompt.answerLanguage)
    .map((w) => ({ id: w.id, text: w.text }));
}

// The correct option (the word's first translation, or the word itself for the reverse
// direction) plus up to 3 distractors of the same word_type/language, drawn from other lesson
// words' translations (or from other lesson words themselves, for the reverse direction).
export function buildChoiceOptions(lessonWords: Word[], word: Word, direction: Direction, prompt: QuizPrompt): QuizChoiceOption[] {
  const translation = word.translations[0];
  if (!translation) return [];
  const correct: QuizChoiceOption = direction === 'source_to_target'
    ? { id: translation.id, text: translation.text }
    : { id: word.id, text: word.text };

  const pool = dedupeById(choicePool(lessonWords, word, direction, prompt)).filter((o) => o.id !== correct.id);
  const distractors = shuffle(pool).slice(0, 3);
  return shuffle([correct, ...distractors]);
}
