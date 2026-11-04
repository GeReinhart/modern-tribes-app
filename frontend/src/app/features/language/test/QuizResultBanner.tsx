import { ThemedButton } from '@/app/platform/core/layout/themes/components/ThemedButton.tsx';
import { ThemedCard } from '@/app/platform/core/layout/themes/components/ThemedCard.tsx';
import { ThemedText } from '@/app/platform/core/layout/themes/components/ThemedText.tsx';

import React, { useState } from 'react';
import { useTranslation } from 'react-i18next';

import GivenAnswerLine from './GivenAnswerLine.tsx';
import { GivenAnswer, TestAnswerResult } from './types.ts';

interface Props {
  result: TestAnswerResult;
  // What was asked: the word to translate (or the noun), with the translation direction when there is one.
  originalWord: string;
  directionLabel?: string;
  givenAnswer: GivenAnswer;
  // Shown instead of the bare correct answer, e.g. the article together with its noun.
  correctAnswerLabel?: string;
  onContinue: () => void;
}

// How many different comments a wrong answer can get (keys `features.language.incorrect0..9`).
const INCORRECT_MESSAGE_COUNT = 10;

const QuizResultBanner: React.FC<Props> = ({
  result, originalWord, directionLabel, givenAnswer, correctAnswerLabel, onContinue,
}) => {
  const { t } = useTranslation();
  // Drawn once per result: the banner is mounted anew for each answer, so the comment varies
  // from one wrong answer to the next but stays put while this result is shown.
  const [incorrectIndex] = useState(() => Math.floor(Math.random() * INCORRECT_MESSAGE_COUNT));
  const solution = correctAnswerLabel ?? result.correct_answer;

  return (
    <ThemedCard variant={result.correct ? 'success' : 'danger'}>
      <ThemedText variant={result.correct ? 'success' : 'danger'} size="medium">
        {result.correct ? t('features.language.correct') : t(`features.language.incorrect${incorrectIndex}`)}
      </ThemedText>
      <div style={{ display: 'flex', flexDirection: 'column', gap: '2px' }}>
        {directionLabel && <ThemedText variant="secondary" size="small">{directionLabel}</ThemedText>}
        <ThemedText size="medium">{originalWord}</ThemedText>
        <GivenAnswerLine given={givenAnswer.text} solution={solution} correct={result.correct} compareLetters={givenAnswer.typed} />
        {!result.correct && (
          <ThemedText size="medium"><strong>{solution}</strong></ThemedText>
        )}
      </div>
      <ThemedText variant="secondary" size="small">
        {t('features.language.wordScorePercent', { percent: Math.round(result.word_score * 100) })}
      </ThemedText>
      <ThemedButton onClick={onContinue} fullWidth={false}>{t('features.language.continue')}</ThemedButton>
    </ThemedCard>
  );
};

export default QuizResultBanner;
