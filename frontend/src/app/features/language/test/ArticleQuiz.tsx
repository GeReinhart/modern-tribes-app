import { ThemedButton } from '@/app/platform/core/layout/themes/components/ThemedButton.tsx';
import { ThemedSection } from '@/app/platform/core/layout/themes/components/ThemedSection.tsx';
import { ThemedText } from '@/app/platform/core/layout/themes/components/ThemedText.tsx';

import React, { useMemo } from 'react';
import { useTranslation } from 'react-i18next';

import { articleChoices, buildNounCandidates } from './nounQuiz.ts';
import QuizResultBanner from './QuizResultBanner.tsx';
import { useNounQuiz } from './useNounQuiz.ts';
import { themeCodeForLanguage } from '../shared/languageTheme.ts';
import { Language, Word } from '../shared/types.ts';

interface Props {
  lessonId: string;
  words: Word[];
  languages: Language[];
  targetLanguage: string;
}

// The noun is shown, the user picks its article among the language's articles.
const ArticleQuiz: React.FC<Props> = ({ lessonId, words, languages, targetLanguage }) => {
  const { t } = useTranslation();
  const candidates = useMemo(() => buildNounCandidates(words, targetLanguage, 'article'), [words, targetLanguage]);
  const choices = useMemo(() => articleChoices(candidates, targetLanguage), [candidates, targetLanguage]);
  const { current, result, submitting, error, submit, continueToNext } = useNounQuiz(lessonId, candidates, 'article');

  if (!current) {
    return <ThemedText variant="secondary" size="small">{t('features.language.noArticleWords')}</ThemedText>;
  }
  if (result) {
    return (
      <QuizResultBanner
        result={result}
        correctAnswerLabel={`${result.correct_answer} ${current.text}`}
        onContinue={continueToNext}
      />
    );
  }

  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: '12px' }}>
      <ThemedSection themeId={themeCodeForLanguage(languages, current.language)}>
        <ThemedText size="small" variant="secondary">{t('features.language.articleQuestion')}</ThemedText>
        <ThemedText as="h2" size="medium">{current.text}</ThemedText>
      </ThemedSection>
      {error && <ThemedText variant="danger" size="small">{error}</ThemedText>}
      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(90px, 1fr))', gap: '8px' }}>
        {choices.map((article) => (
          <ThemedButton key={article} type="button" variant="secondary" disabled={submitting} onClick={() => submit(article)}>
            {article}
          </ThemedButton>
        ))}
      </div>
    </div>
  );
};

export default ArticleQuiz;
