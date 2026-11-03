import { ThemedSection } from '@/app/platform/core/layout/themes/components/ThemedSection.tsx';
import { useTheme } from '@/app/platform/core/layout/themes/ThemeContext.tsx';

import React from 'react';
import { useTranslation } from 'react-i18next';

import { TranslationWord } from './types.ts';
import WordFacts from './WordFacts.tsx';

interface Props {
  translation: TranslationWord;
  themeCode?: string;
}

// One translation, colored by its own language's theme -- independently of the main word's
// theme, since a word and its translation are (by definition) two different languages.
const WordTranslationBlock: React.FC<Props> = ({ translation, themeCode }) => (
  <ThemedSection themeId={themeCode}>
    <WordTranslationBlockContent translation={translation} />
  </ThemedSection>
);

const WordTranslationBlockContent: React.FC<{ translation: TranslationWord }> = ({ translation }) => {
  const { theme } = useTheme();
  const { t } = useTranslation();

  return (
    <div>
      <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
        <span style={{ color: theme.colors.primary }}>{translation.text}</span>
        <span style={{ fontSize: 'var(--font-xs)', color: theme.colors.secondary }}>
          {t(`features.language.code.${translation.language}`)}
        </span>
      </div>
      <WordFacts article={translation.article} plural={translation.plural} declensions={translation.declensions} />
    </div>
  );
};

export default WordTranslationBlock;
