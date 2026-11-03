import { ThemedText } from '@/app/platform/core/layout/themes/components/ThemedText.tsx';

import { useRegisterTabActions } from '@/app/platform/core/layout/useRegisterTabActions.ts';

import React, { useMemo, useState } from 'react';
import { useTranslation } from 'react-i18next';

import TestLessonView from './TestLessonView.tsx';
import TestLessonScoreBadge from './TestLessonScoreBadge.tsx';
import { useLessonsList } from '../shared/useLessonsList.ts';
import LessonList from '../shared/LessonList.tsx';
import type { FeatureTabProps } from '../../glue/registry.ts';

const TestTab: React.FC<FeatureTabProps> = ({ projectId }) => {
  const { t } = useTranslation();
  const { lessons, error } = useLessonsList(projectId);
  const [selectedLessonId, setSelectedLessonId] = useState<string | null>(null);

  const tabActions = useMemo(
    () => (selectedLessonId
      ? [{ id: 'language.test.backToLessons', icon: 'arrow-left' as const, label: t('features.language.backToLessons'), onClick: () => setSelectedLessonId(null) }]
      : []),
    [selectedLessonId, t],
  );
  useRegisterTabActions(tabActions);

  if (selectedLessonId) {
    return <TestLessonView lessonId={selectedLessonId} projectId={projectId} />;
  }

  return (
    <div>
      {error && <ThemedText variant="danger" size="small">{error}</ThemedText>}
      <LessonList
        lessons={lessons}
        onOpen={setSelectedLessonId}
        renderTrailing={(lesson) => <TestLessonScoreBadge lessonId={lesson.id} />}
      />
    </div>
  );
};

export default TestTab;
