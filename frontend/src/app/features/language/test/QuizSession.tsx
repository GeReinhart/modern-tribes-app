import { ThemedButton } from '@/app/platform/core/layout/themes/components/ThemedButton.tsx';
import { ThemedText } from '@/app/platform/core/layout/themes/components/ThemedText.tsx';

import React from 'react';
import { useTranslation } from 'react-i18next';

import QuizResultBanner from './QuizResultBanner.tsx';
import QuizWordPrompt from './QuizWordPrompt.tsx';
import { Direction } from './types.ts';
import { useQuizSession } from './useQuizSession.ts';
import { Language, Word } from '../shared/types.ts';

interface Props {
  lessonId: string;
  words: Word[];
  languages: Language[];
  // Full test: every translated word once, shuffled, in one direction, with a "word n / total" counter.
  // Random test: endless, weighted toward the words with the lowest scores.
  fullTest: boolean;
  // Pins the direction of every question; random on each question when omitted.
  direction?: Direction;
}

const QuizSession: React.FC<Props> = ({ lessonId, words, languages, fullTest, direction }) => {
  const { t } = useTranslation();
  const {
    question, result, submitting, error, reviewFinished, restart, submit, continueToNext, position, total,
  } = useQuizSession(lessonId, words, fullTest, direction);

  if (words.length === 0) {
    return <ThemedText variant="secondary" size="small">{t('features.language.noWords')}</ThemedText>;
  }
  if (reviewFinished) {
    return (
      <div style={{ display: 'flex', flexDirection: 'column', gap: '12px', alignItems: 'flex-start' }}>
        <ThemedText variant="secondary">{t('features.language.reviewComplete')}</ThemedText>
        <ThemedButton fullWidth={false} icon="rotate-cw" onClick={restart}>
          {t('features.language.restartFullTest')}
        </ThemedButton>
      </div>
    );
  }
  if (!question) {
    return <ThemedText variant="secondary" size="small">{t('features.language.noTestableWords')}</ThemedText>;
  }

  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: '12px' }}>
      {fullTest && (
        <ThemedText variant="secondary" size="small">
          {t('features.language.wordCounter', { current: position, total })}
        </ThemedText>
      )}
      {error && <ThemedText variant="danger" size="small">{error}</ThemedText>}
      {result ? (
        <QuizResultBanner result={result} onContinue={continueToNext} />
      ) : (
        <QuizWordPrompt
          lessonWords={words}
          languages={languages}
          word={question.word}
          direction={question.direction}
          prompt={question.prompt}
          submitting={submitting}
          onSubmitFree={(answer) => submit('free', answer)}
          onSubmitChoice={(chosenWordId) => submit('choice', undefined, chosenWordId)}
        />
      )}
    </div>
  );
};

export default QuizSession;
