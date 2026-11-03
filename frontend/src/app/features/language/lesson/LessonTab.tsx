import { ThemedLoadingSpinner } from '@/app/platform/core/layout/themes/components/ThemedLoadingSpinner.tsx';
import { ThemedText } from '@/app/platform/core/layout/themes/components/ThemedText.tsx';
import { usePersistedString } from '@/app/platform/core/browser/usePersistedString.ts';
import { useRegisterTabActions } from '@/app/platform/core/layout/useRegisterTabActions.ts';

import React, { useMemo, useState } from 'react';
import { useTranslation } from 'react-i18next';
import { useNavigate, useSearchParams } from 'react-router-dom';

import CreateLessonModal from './CreateLessonModal.tsx';
import LanguageColorsModal from './LanguageColorsModal.tsx';
import LanguagePairSetupForm from './LanguagePairSetupForm.tsx';
import LessonDetailPanel from './LessonDetailPanel.tsx';
import { LESSON_SUB_TABS, LESSON_SUB_TAB_STORAGE_KEY } from '../shared/lessonSubTabs.ts';
import { addWordPath } from './wordFormRoutes.ts';
import { useLanguageSettings } from '../shared/useLanguageSettings.ts';
import { useLessonsList } from '../shared/useLessonsList.ts';
import LessonList from '../shared/LessonList.tsx';
import type { FeatureTabProps } from '../../glue/registry.ts';

const LessonTab: React.FC<FeatureTabProps> = ({ canEdit, projectId, tribeId, featureInstanceId }) => {
  const { t } = useTranslation();
  const { settings, loading: settingsLoading, error: settingsError, setPair } = useLanguageSettings(projectId);
  const { lessons, error: lessonsError, createLesson, refetch: refetchLessons } = useLessonsList(projectId);
  // Kept in the URL (not local state) so navigating away to the add/edit word page and back
  // lands on the same lesson, instead of resetting to the lesson list.
  const [searchParams, setSearchParams] = useSearchParams();
  const selectedLessonId = searchParams.get('lessonId');
  const navigate = useNavigate();
  const [subTab, setSubTab] = usePersistedString(LESSON_SUB_TAB_STORAGE_KEY, LESSON_SUB_TABS, 'lesson');
  const [creating, setCreating] = useState(false);
  const [configuringColors, setConfiguringColors] = useState(false);

  const tabActions = useMemo(
    () => [
      ...(selectedLessonId
        ? [{ id: 'language.backToLessons', icon: 'arrow-left' as const, label: t('features.language.backToLessons'), onClick: () => setSearchParams({}) }]
        : []),
      ...(canEdit && selectedLessonId && subTab === 'vocabulary'
        ? [{
            id: 'language.addWord',
            icon: 'plus' as const,
            label: t('features.language.addWord'),
            onClick: () => navigate(addWordPath(tribeId, projectId, featureInstanceId, selectedLessonId)),
          }]
        : []),
      ...(canEdit && settings && !selectedLessonId
        ? [{ id: 'language.newLesson', icon: 'plus' as const, label: t('features.language.newLesson'), onClick: () => setCreating(true) }]
        : []),
      ...(canEdit && settings
        ? [{
            id: 'language.configureColors',
            icon: 'palette' as const,
            label: t('features.language.configureColors'),
            onClick: () => setConfiguringColors(true),
          }]
        : []),
    ],
    [canEdit, settings, selectedLessonId, subTab, navigate, tribeId, projectId, featureInstanceId, setSearchParams, t],
  );
  useRegisterTabActions(tabActions);

  const colorsModal = configuringColors && settings && (
    <LanguageColorsModal settings={settings} onClose={() => setConfiguringColors(false)} />
  );

  if (settingsLoading) {
    return <div style={{ display: 'flex', justifyContent: 'center', padding: '24px' }}><ThemedLoadingSpinner size="sm" /></div>;
  }

  if (!settings) {
    return (
      <>
        <LanguagePairSetupForm error={settingsError} onSubmit={setPair} />
        {colorsModal}
      </>
    );
  }

  if (selectedLessonId) {
    return (
      <>
        <LessonDetailPanel
          lessonId={selectedLessonId}
          canEdit={canEdit}
          languageSettings={settings}
          tribeId={tribeId}
          projectId={projectId}
          featureInstanceId={featureInstanceId}
          subTab={subTab}
          onSubTabChange={setSubTab}
          onLessonUpdated={refetchLessons}
        />
        {colorsModal}
      </>
    );
  }

  return (
    <div>
      {lessonsError && <ThemedText variant="danger" size="small">{lessonsError}</ThemedText>}
      <LessonList lessons={lessons} onOpen={(lessonId) => setSearchParams({ lessonId })} />
      {creating && (
        <CreateLessonModal onClose={() => setCreating(false)} onCreate={createLesson} />
      )}
      {colorsModal}
    </div>
  );
};

export default LessonTab;
