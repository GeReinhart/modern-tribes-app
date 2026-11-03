import { Word } from '../shared/types.ts';

export type NounFact = 'article' | 'plural';

// A noun of the learned language that has an article / a plural: what the article and plural
// tests show. The noun is either the lesson word itself or its translation (the lesson word may
// be in the known language), so the score to weigh by is the lesson word's.
export interface NounCandidate {
  lessonWordId: string;
  entryId: string;
  text: string;
  language: string;
  article: string;
}

// The articles each language offers as choices, completed with the ones met in the lesson.
const DEFAULT_ARTICLES: Record<string, string[]> = {
  de: ['der', 'die', 'das'],
  fr: ['le', 'la', "l'", 'les'],
};

export function buildNounCandidates(words: Word[], targetLanguage: string, fact: NounFact): NounCandidate[] {
  return words.flatMap((word) => {
    const entry = word.language === targetLanguage
      ? word
      : word.translations.find((t) => t.language === targetLanguage);
    if (!entry || entry.word_type !== 'noun' || !entry[fact]?.trim()) return [];
    return [{
      lessonWordId: word.id, entryId: entry.id, text: entry.text,
      language: entry.language, article: (entry.article ?? '').trim(),
    }];
  });
}

export function articleChoices(candidates: NounCandidate[], language: string): string[] {
  const seen = new Set<string>();
  const choices: string[] = [];
  [...(DEFAULT_ARTICLES[language] ?? []), ...candidates.filter((c) => c.language === language).map((c) => c.article)]
    .filter((article) => article)
    .forEach((article) => {
      if (!seen.has(article.toLowerCase())) {
        seen.add(article.toLowerCase());
        choices.push(article);
      }
    });
  return choices;
}
