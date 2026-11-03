import { ThemedButton } from '@/app/platform/core/layout/themes/components/ThemedButton.tsx';
import { ThemedSection } from '@/app/platform/core/layout/themes/components/ThemedSection.tsx';
import { ThemedText } from '@/app/platform/core/layout/themes/components/ThemedText.tsx';

import React, { useEffect, useMemo, useState } from 'react';
import { useTranslation } from 'react-i18next';

import { buildChoiceOptions, QuizPrompt, sameTypeCount } from './quizPicker.ts';
import { Direction, TestMode } from './types.ts';
import LanguageTextInput from '../shared/LanguageTextInput.tsx';
import { themeCodeForLanguage } from '../shared/languageTheme.ts';
import { Language, Word } from '../shared/types.ts';

interface Props {
  lessonWords: Word[];
  languages: Language[];
  word: Word;
  direction: Direction;
  prompt: QuizPrompt;
  submitting: boolean;
  onSubmitFree: (answer: string) => void;
  onSubmitChoice: (chosenWordId: string) => void;
}

const QuizWordPrompt: React.FC<Props> = ({
  lessonWords, languages, word, direction, prompt, submitting, onSubmitFree, onSubmitChoice,
}) => {
  const { t } = useTranslation();
  const [mode, setMode] = useState<TestMode>('free');
  const [answer, setAnswer] = useState('');
  const canUseChoice = sameTypeCount(lessonWords, prompt.testedWordType) >= 4;
  const choiceOptions = useMemo(
    () => (canUseChoice ? buildChoiceOptions(lessonWords, word, direction, prompt) : []),
    [lessonWords, word, direction, prompt, canUseChoice],
  );
  const promptThemeCode = themeCodeForLanguage(languages, prompt.promptLanguage);
  const answerThemeCode = themeCodeForLanguage(languages, prompt.answerLanguage);

  // Switching to the choices is one-way for a given question: they give the answer away, so
  // there is no going back to typing it.
  useEffect(() => {
    setAnswer('');
    setMode('free');
  }, [word.id, direction]);

  const handleFreeSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (answer.trim()) onSubmitFree(answer.trim());
  };

  return (
    <div>
      <ThemedSection themeId={promptThemeCode}>
        <ThemedText size="small" variant="secondary">
          {t(`features.language.code.${prompt.promptLanguage}`)} → {t(`features.language.code.${prompt.answerLanguage}`)}
        </ThemedText>
        <ThemedText as="h2" size="medium">{prompt.promptText}</ThemedText>
      </ThemedSection>

      <ThemedSection themeId={answerThemeCode}>
        {mode === 'free' ? (
          <form onSubmit={handleFreeSubmit} style={{ display: 'flex', gap: '8px' }}>
            <LanguageTextInput
              value={answer}
              language={prompt.answerLanguage}
              onValueChange={setAnswer}
              autoFocus
              containerStyle={{ flex: 1 }}
            />
            <ThemedButton type="submit" icon="check" iconOnly isLoading={submitting} disabled={!answer.trim()}>
              {t('features.language.submitAnswer')}
            </ThemedButton>
            {canUseChoice && (
              <ThemedButton type="button" variant="secondary" icon="list" iconOnly disabled={submitting} onClick={() => setMode('choice')}>
                {t('features.language.choiceMode')}
              </ThemedButton>
            )}
          </form>
        ) : (
          <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '8px' }}>
            {choiceOptions.map((option) => (
              <ThemedButton key={option.id} type="button" variant="secondary" disabled={submitting} onClick={() => onSubmitChoice(option.id)}>
                {option.text}
              </ThemedButton>
            ))}
          </div>
        )}
      </ThemedSection>
    </div>
  );
};

export default QuizWordPrompt;
