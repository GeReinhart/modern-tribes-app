import { ThemedText } from '@/app/platform/core/layout/themes/components/ThemedText.tsx';
import { useTheme } from '@/app/platform/core/layout/themes/ThemeContext.tsx';

import React from 'react';
import { useTranslation } from 'react-i18next';

import { CORRECT_COLOR, WRONG_COLOR } from './attemptColors.ts';
import { WordAttempt, WordScore } from './types.ts';
import { Language, Word } from '../shared/types.ts';
import WordCompactCard from '../shared/WordCompactCard.tsx';

interface Props {
  word: Word;
  languages: Language[];
  score?: WordScore;
}

const formatPercent = (score: number) => `${Math.round(score * 100)}%`;

// Same card as everywhere a word is listed, plus the word's score for the chosen person and
// the history of that person's answers (date, direction, mode, right or wrong).
const WordResultCard: React.FC<Props> = ({ word, languages, score }) => {
  const { t } = useTranslation();
  const { theme } = useTheme();
  const attempts = score?.attempts ?? [];

  const directionLabel = (attempt: WordAttempt) => {
    if (attempt.direction === 'article') return t('features.language.testTabArticles');
    if (attempt.direction === 'plural') return t('features.language.testTabPlurals');
    const from = word.language.toUpperCase();
    const to = (word.translations[0]?.language ?? '').toUpperCase();
    return attempt.direction === 'source_to_target' ? `${from} → ${to}` : `${to} → ${from}`;
  };

  return (
    <div style={{ border: `1px solid ${theme.colors.border}`, borderRadius: 'var(--radius-md)', overflow: 'hidden' }}>
      <div style={{ display: 'flex', alignItems: 'center', gap: '12px', paddingRight: '8px' }}>
        <div style={{ flex: 1, minWidth: 0 }}><WordCompactCard word={word} languages={languages} /></div>
        <span style={{ fontSize: 'var(--font-lg)', fontWeight: 700, color: theme.colors.primary }}>
          {formatPercent(score?.score ?? 0)}
        </span>
      </div>
      <div style={{ display: 'flex', flexWrap: 'wrap', gap: '4px 12px', padding: '4px 10px 6px' }}>
        {attempts.length === 0 && (
          <ThemedText variant="secondary" size="small">{t('features.language.noAttemptsYet')}</ThemedText>
        )}
        {attempts.map((attempt) => (
          <span
            key={`${attempt.created_at}-${attempt.direction}`}
            style={{ fontSize: 'var(--font-xs)', color: attempt.correct ? CORRECT_COLOR : WRONG_COLOR }}
          >
            {attempt.correct ? '✓' : '✗'} {new Date(attempt.created_at).toLocaleDateString()} · {directionLabel(attempt)} · {t(`features.language.testMode.${attempt.mode}`)}
          </span>
        ))}
      </div>
    </div>
  );
};

export default WordResultCard;
