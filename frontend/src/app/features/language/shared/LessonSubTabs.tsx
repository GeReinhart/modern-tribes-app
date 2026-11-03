import { ThemedTabs } from '@/app/platform/core/layout/themes/components/ThemedTabs.tsx';

import React from 'react';
import { useTranslation } from 'react-i18next';

import { LESSON_SUB_TABS, LessonSubTab } from './lessonSubTabs.ts';

interface Props {
  active: LessonSubTab;
  onChange: (subTab: LessonSubTab) => void;
}

// The "lesson" / "vocabulary" sub-tab bar shared by the lesson (edit) and learn tabs.
const LessonSubTabs: React.FC<Props> = ({ active, onChange }) => {
  const { t } = useTranslation();
  const labelKeys: Record<LessonSubTab, string> = {
    lesson: 'features.language.subTabLesson',
    vocabulary: 'features.language.subTabVocabulary',
  };
  return (
    <ThemedTabs
      tabs={LESSON_SUB_TABS.map((key) => ({ key, label: t(labelKeys[key]) }))}
      activeTab={active}
      onTabChange={(key) => onChange(key as LessonSubTab)}
    />
  );
};

export default LessonSubTabs;
