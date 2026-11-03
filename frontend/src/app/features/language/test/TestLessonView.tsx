import { usePersistedString } from '@/app/platform/core/browser/usePersistedString.ts';
import { ThemedLoadingSpinner } from '@/app/platform/core/layout/themes/components/ThemedLoadingSpinner.tsx';
import { ThemedTabs } from '@/app/platform/core/layout/themes/components/ThemedTabs.tsx';
import { ThemedText } from '@/app/platform/core/layout/themes/components/ThemedText.tsx';

import React from 'react';
import { useTranslation } from 'react-i18next';

import ArticleQuiz from './ArticleQuiz.tsx';
import PluralQuiz from './PluralQuiz.tsx';
import QuizSession from './QuizSession.tsx';
import { Direction } from './types.ts';
import ResultsPanel from './ResultsPanel.tsx';
import { TEST_SUB_TAB_STORAGE_KEY, TEST_SUB_TABS, TestSubTab } from './testSubTabs.ts';
import { useLanguageSettings } from '../shared/useLanguageSettings.ts';
import { useLessonDetail } from '../shared/useLessonDetail.ts';
import { useLanguages } from '../shared/useLanguages.ts';

interface Props {
  lessonId: string;
  projectId: string;
}

const FULL_TEST_DIRECTIONS: Partial<Record<TestSubTab, Direction>> = {
  full_forward: 'source_to_target',
  full_backward: 'target_to_source',
};

const TAB_LABEL_KEYS: Record<'random' | 'articles' | 'plurals' | 'results', string> = {
  articles: 'features.language.testTabArticles',
  plurals: 'features.language.testTabPlurals',
  random: 'features.language.testTabRandom',
  results: 'features.language.testTabResults',
};

// One lesson's test page: full test, random test and results as sub-tabs (the chosen one is
// remembered). Its "back to lessons" action is registered by TestTab, not rendered here.
const TestLessonView: React.FC<Props> = ({ lessonId, projectId }) => {
  const { t } = useTranslation();
  const { detail, loading, error } = useLessonDetail(lessonId);
  const { languages } = useLanguages();
  const { settings } = useLanguageSettings(projectId);
  const [subTab, setSubTab] = usePersistedString(TEST_SUB_TAB_STORAGE_KEY, TEST_SUB_TABS, 'random');

  // The two full tests are named after the project's language pair, e.g. "Test FR → DE".
  const tabLabel = (key: TestSubTab): string => {
    if (key === 'random' || key === 'articles' || key === 'plurals' || key === 'results') return t(TAB_LABEL_KEYS[key]);
    const [from, to] = [settings?.source_language ?? '', settings?.target_language ?? ''].map((c) => c.toUpperCase());
    return key === 'full_forward'
      ? t('features.language.testTabDirection', { from, to })
      : t('features.language.testTabDirection', { from: to, to: from });
  };

  if (loading || !detail) {
    return (
      <div style={{ display: 'flex', justifyContent: 'center', padding: '24px' }}>
        {error ? <ThemedText variant="danger">{error}</ThemedText> : <ThemedLoadingSpinner size="sm" />}
      </div>
    );
  }

  return (
    <div>
      <ThemedText as="h2" size="medium">{detail.title}</ThemedText>
      <ThemedTabs
        tabs={TEST_SUB_TABS.map((key) => ({ key, label: tabLabel(key) }))}
        activeTab={subTab}
        onTabChange={(key) => setSubTab(key as TestSubTab)}
      />
      <div style={{ marginTop: '16px' }}>
        {subTab === 'results' ? (
          <ResultsPanel lessonId={lessonId} words={detail.words} languages={languages} />
        ) : subTab === 'articles' ? (
          <ArticleQuiz
            lessonId={lessonId}
            words={detail.words}
            languages={languages}
            targetLanguage={settings?.target_language ?? ''}
          />
        ) : subTab === 'plurals' ? (
          <PluralQuiz
            lessonId={lessonId}
            words={detail.words}
            languages={languages}
            targetLanguage={settings?.target_language ?? ''}
          />
        ) : (
          <QuizSession key={subTab} lessonId={lessonId} words={detail.words} languages={languages} fullTest={subTab.startsWith('full')} direction={FULL_TEST_DIRECTIONS[subTab]} />
        )}
      </div>
    </div>
  );
};

export default TestLessonView;
