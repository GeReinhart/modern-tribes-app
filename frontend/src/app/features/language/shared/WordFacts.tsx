import { useTheme } from '@/app/platform/core/layout/themes/ThemeContext.tsx';

import React from 'react';
import { useTranslation } from 'react-i18next';

import { Declension } from './types.ts';

interface Props {
  article?: string | null;
  plural?: string | null;
  declensions: Declension[];
}

// The article/plural/declension facts shown for a word, reused for the main word and for
// each of its translations (same shape, `TranslationWord` vs `Word`).
const WordFacts: React.FC<Props> = ({ article, plural, declensions }) => {
  const { theme } = useTheme();
  const { t } = useTranslation();
  const hasFacts = Boolean(article) || Boolean(plural) || declensions.length > 0;
  if (!hasFacts) return null;

  return (
    <div style={{ fontSize: 'var(--font-xs)', color: theme.colors.secondary, marginTop: '2px' }}>
      {article && <span>{t('features.language.article')}: {article} </span>}
      {plural && <span>{t('features.language.plural')}: {plural} </span>}
      {declensions.length > 0 && (
        <div style={{ display: 'flex', flexWrap: 'wrap', gap: '6px', marginTop: '2px' }}>
          {declensions.map((d) => (
            <span
              key={d.case_label}
              style={{ border: `1px solid ${theme.colors.border}`, borderRadius: 'var(--radius-sm)', padding: '0 6px' }}
            >
              {d.case_label}: {d.form}
            </span>
          ))}
        </div>
      )}
    </div>
  );
};

export default WordFacts;
