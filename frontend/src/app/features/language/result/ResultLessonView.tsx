import { ThemedLoadingSpinner } from '@/app/platform/core/layout/themes/components/ThemedLoadingSpinner.tsx';
import { ThemedText } from '@/app/platform/core/layout/themes/components/ThemedText.tsx';

import React from 'react';

import ResultsPanel from './ResultsPanel.tsx';
import { useLanguages } from '../shared/useLanguages.ts';
import { useLessonDetail } from '../shared/useLessonDetail.ts';

// One lesson's results page: its title, then the sub-tabs of ResultsPanel. Its "back to lessons"
// action is registered by ResultTab, not rendered here.
const ResultLessonView: React.FC<{ lessonId: string }> = ({ lessonId }) => {
  const { detail, loading, error } = useLessonDetail(lessonId);
  const { languages } = useLanguages();

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
      <div style={{ marginTop: '16px' }}>
        <ResultsPanel lessonId={lessonId} words={detail.words} languages={languages} />
      </div>
    </div>
  );
};

export default ResultLessonView;
