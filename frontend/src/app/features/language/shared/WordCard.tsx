import { ThemedBadge } from '@/app/platform/core/layout/themes/components/ThemedBadge.tsx';
import { ThemedSection } from '@/app/platform/core/layout/themes/components/ThemedSection.tsx';
import { useTheme } from '@/app/platform/core/layout/themes/ThemeContext.tsx';

import React from 'react';
import { useTranslation } from 'react-i18next';

import { themeCodeForLanguage } from './languageTheme.ts';
import { Language, Word } from './types.ts';
import WordFacts from './WordFacts.tsx';
import WordTranslationBlock from './WordTranslationBlock.tsx';

interface Props {
  word: Word;
  languages: Language[];
}

// Full read view of one word and its translation(s), used by the learn tab's word list, the
// lesson tab's word list (while editing) and nowhere else -- the test tab's multiple-choice
// options are plain buttons, not full cards. The word and each translation are colored by their
// own language's configured theme (see shared/languageTheme.ts), since they're different languages.
const WordCard: React.FC<Props> = ({ word, languages }) => (
  <ThemedSection themeId={themeCodeForLanguage(languages, word.language)}>
    <WordCardContent word={word} languages={languages} />
  </ThemedSection>
);

const WordCardContent: React.FC<Props> = ({ word, languages }) => {
  const { theme } = useTheme();
  const { t } = useTranslation();

  return (
    <div style={{ border: `1px solid ${theme.colors.border}`, borderRadius: 'var(--radius-md)', padding: '10px 12px' }}>
      <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
        <span style={{ fontWeight: 600, color: theme.colors.text }}>{word.text}</span>
        <ThemedBadge variant="secondary">{t(`features.language.wordType.${word.word_type}`)}</ThemedBadge>
        <span style={{ fontSize: 'var(--font-xs)', color: theme.colors.secondary }}>
          {t(`features.language.code.${word.language}`)}
        </span>
      </div>
      <WordFacts article={word.article} plural={word.plural} declensions={word.declensions} />

      {word.translations.length > 0 && (
        <div style={{ marginTop: '8px', paddingTop: '8px', borderTop: `1px dashed ${theme.colors.border}`, display: 'flex', flexDirection: 'column', gap: '6px' }}>
          {word.translations.map((translation) => (
            <WordTranslationBlock
              key={translation.id}
              translation={translation}
              themeCode={themeCodeForLanguage(languages, translation.language)}
            />
          ))}
        </div>
      )}
    </div>
  );
};

export default WordCard;
