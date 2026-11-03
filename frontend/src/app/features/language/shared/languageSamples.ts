import { Language, Word } from './types.ts';

interface SampleNoun {
  text: string;
  article: string;
}

// The same four everyday nouns (cat, dog, house, book) in each language that has samples, in
// the same order, so any pair of these languages can be previewed as translated words.
const SAMPLE_NOUNS: Record<string, SampleNoun[]> = {
  fr: [{ text: 'chat', article: 'le' }, { text: 'chien', article: 'le' }, { text: 'maison', article: 'la' }, { text: 'livre', article: 'le' }],
  en: [{ text: 'cat', article: '' }, { text: 'dog', article: '' }, { text: 'house', article: '' }, { text: 'book', article: '' }],
  de: [{ text: 'Katze', article: 'die' }, { text: 'Hund', article: 'der' }, { text: 'Haus', article: 'das' }, { text: 'Buch', article: 'das' }],
};

const entryOf = (language: string, noun: SampleNoun, id: string) => ({
  id, text: noun.text, language, word_type: 'noun' as const, article: noun.article, plural: null, declensions: [],
});

// Four sample words of `source` translated into `target`; empty when either has no samples.
export function sampleWords(source: string, target: string): Word[] {
  const sources = SAMPLE_NOUNS[source];
  const targets = SAMPLE_NOUNS[target];
  if (!sources || !targets) return [];
  return sources.map((noun, index) => ({
    ...entryOf(source, noun, `sample-${source}-${index}`),
    translations: [entryOf(target, targets[index], `sample-${target}-${index}`)],
  }));
}

// `languages` with the given theme codes applied, to preview a choice before saving it.
export function withThemeOverrides(languages: Language[], overrides: Record<string, string | null>): Language[] {
  return languages.map((language) => (
    language.code in overrides ? { ...language, theme_code: overrides[language.code] } : language
  ));
}
