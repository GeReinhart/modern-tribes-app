import { ThemedButton } from '@/app/platform/core/layout/themes/components/ThemedButton.tsx';
import { ThemedCard } from '@/app/platform/core/layout/themes/components/ThemedCard.tsx';
import { ThemedText } from '@/app/platform/core/layout/themes/components/ThemedText.tsx';

import React, { useState } from 'react';
import { useTranslation } from 'react-i18next';

import { TestAnswerResult } from './types.ts';

interface Props {
  result: TestAnswerResult;
  // Shown instead of the bare correct answer, e.g. the article together with its noun.
  correctAnswerLabel?: string;
  onContinue: () => void;
}

// How many different comments a wrong answer can get (keys `features.language.incorrect0..9`).
const INCORRECT_MESSAGE_COUNT = 10;

const QuizResultBanner: React.FC<Props> = ({ result, correctAnswerLabel, onContinue }) => {
  const { t } = useTranslation();
  // Drawn once per result: the banner is mounted anew for each answer, so the comment varies
  // from one wrong answer to the next but stays put while this result is shown.
  const [incorrectIndex] = useState(() => Math.floor(Math.random() * INCORRECT_MESSAGE_COUNT));

  return (
    <ThemedCard variant={result.correct ? 'success' : 'danger'}>
      <ThemedText variant={result.correct ? 'success' : 'danger'} size="medium">
        {result.correct ? t('features.language.correct') : t(`features.language.incorrect${incorrectIndex}`)}
      </ThemedText>
      {!result.correct && (
        <ThemedText size="small">{t('features.language.correctAnswerWas', { answer: correctAnswerLabel ?? result.correct_answer })}</ThemedText>
      )}
      <ThemedText variant="secondary" size="small">
        {t('features.language.wordScorePercent', { percent: Math.round(result.word_score * 100) })}
      </ThemedText>
      <ThemedButton onClick={onContinue} fullWidth={false}>{t('features.language.continue')}</ThemedButton>
    </ThemedCard>
  );
};

export default QuizResultBanner;
