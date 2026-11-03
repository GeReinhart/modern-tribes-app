import { ThemedSection } from '@/app/platform/core/layout/themes/components/ThemedSection.tsx';
import { useTheme } from '@/app/platform/core/layout/themes/ThemeContext.tsx';

import React from 'react';
import { useTranslation } from 'react-i18next';

import { themeCodeForLanguage } from './languageTheme.ts';
import { Language, TranslationWord, Word } from './types.ts';
import WordFacts from './WordFacts.tsx';

interface Props {
  word: Word;
  languages: Language[];
}

type Entry = Word | TranslationWord;

// One word in one language: the article (when there is one) before the text, at the same size
// and weight for the main word and its translations. Colored by the entry's own language theme.
const WordEntry: React.FC<{ entry: Entry; themeCode?: string; subline?: string }> = ({ entry, themeCode, subline }) => (
  <ThemedSection themeId={themeCode}>
    <WordEntryContent entry={entry} subline={subline} />
  </ThemedSection>
);

const WordEntryContent: React.FC<{ entry: Entry; subline?: string }> = ({ entry, subline }) => {
  const { theme } = useTheme();
  return (
    <div style={{ minWidth: 0 }}>
      <div style={{ fontSize: 'var(--font-md)', fontWeight: 600, color: theme.colors.primary }}>
        {entry.article ? `${entry.article} ${entry.text}` : entry.text}
      </div>
      {subline && <div style={{ fontSize: 'var(--font-xs)', color: theme.colors.secondary }}>{subline}</div>}
      <WordFacts plural={entry.plural} declensions={entry.declensions} />
    </div>
  );
};

// Dense, two-column read view of a word (left) and its translations (right), used by the
// lesson's vocabulary sub-tab. The language is conveyed by color, never spelled out.
const WordCompactCard: React.FC<Props> = ({ word, languages }) => {
  const { theme } = useTheme();
  const { t } = useTranslation();
  const wordType = t(`features.language.wordType.${word.word_type}`);

  return (
    <div style={{
      display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '4px 12px',
      border: `1px solid ${theme.colors.border}`, borderRadius: 'var(--radius-md)', padding: '4px 28px 4px 8px', height: '100%', boxSizing: 'border-box',
    }}>
      <WordEntry entry={word} themeCode={themeCodeForLanguage(languages, word.language)} subline={wordType} />
      <div style={{ display: 'flex', flexDirection: 'column', gap: '2px', minWidth: 0 }}>
        {word.translations.map((translation) => (
          <WordEntry key={translation.id} entry={translation} themeCode={themeCodeForLanguage(languages, translation.language)} />
        ))}
      </div>
    </div>
  );
};

export default WordCompactCard;
