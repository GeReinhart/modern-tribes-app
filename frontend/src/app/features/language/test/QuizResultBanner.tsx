import { ThemedButton } from '@/app/platform/core/layout/themes/components/ThemedButton.tsx';
import { ThemedCard } from '@/app/platform/core/layout/themes/components/ThemedCard.tsx';
import { ThemedText } from '@/app/platform/core/layout/themes/components/ThemedText.tsx';

import React, { useState } from 'react';
import { useTranslation } from 'react-i18next';

import GivenAnswerLine from './GivenAnswerLine.tsx';
import { GivenAnswer, TestAnswerResult } from './types.ts';

interface Props {
  result: TestAnswerResult;
  // What was asked: the word to translate (or the noun), in `promptLanguage`, answered in `answerLanguage`
  // (the same language for an article or plural test).
  originalWord: string;
  promptLanguage: string;
  answerLanguage: string;
  givenAnswer: GivenAnswer;
  // Shown instead of the bare correct answer, e.g. the article together with its noun.
  correctAnswerLabel?: string;
  onContinue: () => void;
}

// How many different comments a wrong answer can get (keys `features.language.incorrect0..9`).
const INCORRECT_MESSAGE_COUNT = 10;

// One row of the result table: the title in the first column, its value in the second.
const ResultRow: React.FC<{ label: string; children: React.ReactNode }> = ({ label, children }) => (
  <tr>
    <th scope="row" style={{ textAlign: 'left', fontWeight: 'normal', paddingRight: '12px', whiteSpace: 'nowrap' }}>
      <ThemedText variant="secondary" size="small">{label}</ThemedText>
    </th>
    <td>{children}</td>
  </tr>
);

// "FR->DE" for a translation test, just "DE" when the question and the answer share a language.
const askedLanguages = (from: string, to: string) =>
  from === to ? to.toUpperCase() : `${from.toUpperCase()}->${to.toUpperCase()}`;

const QuizResultBanner: React.FC<Props> = ({
  result, originalWord, promptLanguage, answerLanguage, givenAnswer, correctAnswerLabel, onContinue,
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
      <table style={{ borderCollapse: 'collapse', width: '100%' }}>
        <tbody>
          <ResultRow label={t('features.language.askedWord', { languages: askedLanguages(promptLanguage, answerLanguage) })}>
            <ThemedText size="medium">{originalWord}</ThemedText>
          </ResultRow>
          <ResultRow label={t('features.language.yourAnswer')}>
            <GivenAnswerLine given={givenAnswer.text} solution={solution} correct={result.correct} compareLetters={givenAnswer.typed} />
          </ResultRow>
          <ResultRow label={t('features.language.solution', { language: answerLanguage.toUpperCase() })}>
            <ThemedText size="medium"><strong>{solution}</strong></ThemedText>
          </ResultRow>
        </tbody>
      </table>
      <ThemedText variant="secondary" size="small">
        {t('features.language.wordScorePercent', { percent: Math.round(result.word_score * 100) })}
      </ThemedText>
      <ThemedButton onClick={onContinue} fullWidth={false}>{t('features.language.continue')}</ThemedButton>
    </ThemedCard>
  );
};

export default QuizResultBanner;
