import { usePersistedString } from '@/app/platform/core/browser/usePersistedString.ts';
import { ThemedText } from '@/app/platform/core/layout/themes/components/ThemedText.tsx';
import { useRegisterTabActions } from '@/app/platform/core/layout/useRegisterTabActions.ts';

import React, { useMemo } from 'react';
import { useTranslation } from 'react-i18next';

import LearnLessonView from './LearnLessonView.tsx';
import { useLessonPdfDownload } from './useLessonPdfDownload.ts';
import { useLessonsList } from '../shared/useLessonsList.ts';
import { useSelectedLesson } from '../shared/useSelectedLesson.ts';
import LessonList from '../shared/LessonList.tsx';
import { LEARN_SUB_TAB_STORAGE_KEY, LESSON_SUB_TABS } from '../shared/lessonSubTabs.ts';
import type { FeatureTabProps } from '../../glue/registry.ts';

const LearnTab: React.FC<FeatureTabProps> = ({ projectId }) => {
  const { t } = useTranslation();
  const { lessons, error } = useLessonsList(projectId);
  const { selectedLessonId, select: setSelectedLessonId } = useSelectedLesson(projectId, lessons);
  const [subTab, setSubTab] = usePersistedString(LEARN_SUB_TAB_STORAGE_KEY, LESSON_SUB_TABS, 'lesson');
  const lessonTitle = lessons.find((lesson) => lesson.id === selectedLessonId)?.title ?? 'lesson';
  const { download, downloading } = useLessonPdfDownload(selectedLessonId ?? '', lessonTitle);

  const tabActions = useMemo(
    () => (selectedLessonId
      ? [
        { id: 'language.learn.backToLessons', icon: 'arrow-left' as const, label: t('features.language.backToLessons'), onClick: () => setSelectedLessonId(null) },
        { id: 'language.learn.exportPdf', icon: 'download' as const, label: t('features.language.exportPdf'), onClick: download, disabled: downloading },
      ]
      : []),
    [selectedLessonId, downloading, download, t],
  );
  useRegisterTabActions(tabActions);

  if (selectedLessonId) {
    return <LearnLessonView lessonId={selectedLessonId} subTab={subTab} onSubTabChange={setSubTab} />;
  }

  return (
    <div>
      {error && <ThemedText variant="danger" size="small">{error}</ThemedText>}
      <LessonList lessons={lessons} onOpen={setSelectedLessonId} />
    </div>
  );
};

export default LearnTab;
