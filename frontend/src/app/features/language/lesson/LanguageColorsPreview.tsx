import { ThemedText } from '@/app/platform/core/layout/themes/components/ThemedText.tsx';

import React from 'react';
import { useTranslation } from 'react-i18next';

import { sampleWords } from '../shared/languageSamples.ts';
import { Language, LanguageSettings } from '../shared/types.ts';
import WordCompactCard from '../shared/WordCompactCard.tsx';

interface Props {
  settings: LanguageSettings;
  // The project's languages with the colors currently chosen (saved or not).
  languages: Language[];
}

// Four sample words translated between the project's two languages, drawn with the chosen colors.
const LanguageColorsPreview: React.FC<Props> = ({ settings, languages }) => {
  const { t } = useTranslation();
  const words = sampleWords(settings.source_language, settings.target_language);
  if (words.length === 0) return null;

  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: '6px', marginTop: '16px' }}>
      <ThemedText size="small" variant="secondary">{t('features.language.colorsPreview')}</ThemedText>
      {words.map((word) => <WordCompactCard key={word.id} word={word} languages={languages} />)}
    </div>
  );
};

export default LanguageColorsPreview;
