import { ThemedButton } from '@/app/platform/core/layout/themes/components/ThemedButton.tsx';
import { ThemedSection } from '@/app/platform/core/layout/themes/components/ThemedSection.tsx';
import { ThemedText } from '@/app/platform/core/layout/themes/components/ThemedText.tsx';

import React, { useEffect, useMemo, useState } from 'react';
import { useTranslation } from 'react-i18next';

import { buildNounCandidates } from './nounQuiz.ts';
import QuizResultBanner from './QuizResultBanner.tsx';
import { useNounQuiz } from './useNounQuiz.ts';
import LanguageTextInput from '../shared/LanguageTextInput.tsx';
import { themeCodeForLanguage } from '../shared/languageTheme.ts';
import { Language, Word } from '../shared/types.ts';

interface Props {
  lessonId: string;
  words: Word[];
  languages: Language[];
  targetLanguage: string;
}

// The noun is shown, the user types its plural.
const PluralQuiz: React.FC<Props> = ({ lessonId, words, languages, targetLanguage }) => {
  const { t } = useTranslation();
  const candidates = useMemo(() => buildNounCandidates(words, targetLanguage, 'plural'), [words, targetLanguage]);
  const { current, result, givenAnswer, submitting, error, submit, continueToNext } = useNounQuiz(lessonId, candidates, 'plural');
  const [answer, setAnswer] = useState('');

  useEffect(() => setAnswer(''), [current]);

  if (!current) {
    return <ThemedText variant="secondary" size="small">{t('features.language.noPluralWords')}</ThemedText>;
  }
  if (result && givenAnswer) {
    return (
      <QuizResultBanner
        result={result}
        originalWord={current.article ? `${current.article} ${current.text}` : current.text}
        givenAnswer={givenAnswer}
        onContinue={continueToNext}
      />
    );
  }

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (answer.trim()) submit(answer.trim());
  };

  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: '12px' }}>
      <ThemedSection themeId={themeCodeForLanguage(languages, current.language)}>
        <ThemedText size="small" variant="secondary">{t('features.language.pluralQuestion')}</ThemedText>
        <ThemedText as="h2" size="medium">{current.article ? `${current.article} ${current.text}` : current.text}</ThemedText>
      </ThemedSection>
      {error && <ThemedText variant="danger" size="small">{error}</ThemedText>}
      <form onSubmit={handleSubmit} style={{ display: 'flex', gap: '8px' }}>
        <LanguageTextInput value={answer} language={current.language} onValueChange={setAnswer} autoFocus containerStyle={{ flex: 1 }} />
        <ThemedButton type="submit" isLoading={submitting} disabled={!answer.trim()}>
          {t('features.language.submitAnswer')}
        </ThemedButton>
      </form>
    </div>
  );
};

export default PluralQuiz;
