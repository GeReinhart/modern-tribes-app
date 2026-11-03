import { ThemedLoadingSpinner } from '@/app/platform/core/layout/themes/components/ThemedLoadingSpinner.tsx';
import { ThemedText } from '@/app/platform/core/layout/themes/components/ThemedText.tsx';
import { useTheme } from '@/app/platform/core/layout/themes/ThemeContext.tsx';

import React from 'react';

import { useLessonDetail } from '../shared/useLessonDetail.ts';
import { useLanguages } from '../shared/useLanguages.ts';
import LessonSubTabs from '../shared/LessonSubTabs.tsx';
import { LessonSubTab } from '../shared/lessonSubTabs.ts';
import VocabularyTab from '../shared/VocabularyTab.tsx';

interface Props {
  lessonId: string;
  subTab: LessonSubTab;
  onSubTabChange: (subTab: LessonSubTab) => void;
}

// Read-only view of a lesson, split into the same two sub-tabs as the lesson (edit) tab. Its
// page actions (back, PDF download) are registered by LearnTab, not rendered here.
const LearnLessonView: React.FC<Props> = ({ lessonId, subTab, onSubTabChange }) => {
  const { theme } = useTheme();
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
      <LessonSubTabs active={subTab} onChange={onSubTabChange} />
      {subTab === 'lesson' ? (
        <div style={{ marginTop: '16px' }}>
          <ThemedText as="h2" size="medium">{detail.title}</ThemedText>
          <div
            className="prose max-w-none"
            style={{ fontSize: 'var(--font-sm)', color: theme.colors.text }}
            dangerouslySetInnerHTML={{ __html: detail.document.content }}
          />
        </div>
      ) : (
        <VocabularyTab words={detail.words} languages={languages} />
      )}
    </div>
  );
};

export default LearnLessonView;
