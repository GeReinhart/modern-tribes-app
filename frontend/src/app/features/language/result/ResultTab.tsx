import { ThemedText } from '@/app/platform/core/layout/themes/components/ThemedText.tsx';

import React from 'react';

import ResultLessonView from './ResultLessonView.tsx';
import { useLessonsList } from '../shared/useLessonsList.ts';
import { useSelectedLesson } from '../shared/useSelectedLesson.ts';
import LessonList from '../shared/LessonList.tsx';
import type { FeatureTabProps } from '../../glue/registry.ts';

const ResultTab: React.FC<FeatureTabProps> = ({ projectId }) => {
  const { lessons, error } = useLessonsList(projectId);
  const { selectedLessonId, select: setSelectedLessonId } = useSelectedLesson(projectId, lessons);

  if (selectedLessonId) return <ResultLessonView lessonId={selectedLessonId} onBack={() => setSelectedLessonId(null)} />;

  return (
    <div>
      {error && <ThemedText variant="danger" size="small">{error}</ThemedText>}
      <LessonList lessons={lessons} onOpen={setSelectedLessonId} />
    </div>
  );
};

export default ResultTab;
