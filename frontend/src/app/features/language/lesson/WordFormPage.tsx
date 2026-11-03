import { useProject } from '@/app/features/tribes-projects/projects/useProjects.ts';
import { useTribeWithPositions } from '@/app/features/tribes-projects/tribes/useTribesWithPositions.ts';
import { AppLayout } from '@/app/platform/core/layout/AppLayout.tsx';
import { ThemedLoadingSpinner } from '@/app/platform/core/layout/themes/components/ThemedLoadingSpinner.tsx';
import { ThemedSection } from '@/app/platform/core/layout/themes/components/ThemedSection.tsx';
import { ThemeProvider } from '@/app/platform/core/layout/themes/ThemeContext.tsx';
import { errorStyle } from '@/app/platform/core/layout/themes/theme.styles.tsx';

import React, { useMemo } from 'react';
import { useTranslation } from 'react-i18next';
import { useNavigate, useParams } from 'react-router-dom';

import AddWordForm from './AddWordForm.tsx';
import EditWordForm from './EditWordForm.tsx';
import { useLanguageSettings } from '../shared/useLanguageSettings.ts';
import { useLessonWords } from './useLessonWords.ts';
import { lessonTabPath } from './wordFormRoutes.ts';
import { useLessonDetail } from '../shared/useLessonDetail.ts';
import { useLanguages } from '../shared/useLanguages.ts';

type RouteParams = {
  tribeId: string; projectId: string; featureInstanceId: string; lessonId: string; wordId?: string;
};

// A full page rather than a modal, reached from the lesson's "Add word" action and from each
// word row's edit action -- the lesson tab itself has no feature_instance_id of its own route
// segment to return to, so it's carried explicitly (see wordFormRoutes.ts).
const WordFormPageContent: React.FC = () => {
  const { t } = useTranslation();
  const navigate = useNavigate();
  const { tribeId, projectId, featureInstanceId, lessonId, wordId } = useParams<RouteParams>();

  const { tribe } = useTribeWithPositions(tribeId || null);
  const { project } = useProject(projectId || null);
  const { settings } = useLanguageSettings(projectId || '');
  const { detail, loading, error } = useLessonDetail(lessonId || null);
  const { languages } = useLanguages();
  // Nothing on this page itself shows the lesson's word list -- after adding (possibly several
  // words in a row) or editing one, the page eventually navigates back to the lesson tab, which
  // re-fetches on its own mount, so there is nothing local left to refresh here.
  const noopRefetch = useMemo(() => async () => {}, []);
  const { addExisting, createWord, updateWord } = useLessonWords(lessonId || '', noopRefetch);

  const isEdit = Boolean(wordId);
  const word = isEdit ? (detail?.words.find((w) => w.id === wordId) ?? null) : null;
  const lessonPath = tribeId && projectId && featureInstanceId && lessonId
    ? lessonTabPath(tribeId, projectId, featureInstanceId, lessonId)
    : undefined;

  const backToLesson = () => {
    if (lessonPath) navigate(lessonPath);
  };

  const menuActions = useMemo(
    () => [{ id: 'language.backToLesson', icon: 'arrow-left' as const, label: t('features.language.backToLesson'), path: lessonPath }],
    [lessonPath, t],
  );

  const addWordLabel = settings?.target_language === 'de'
    ? t('features.language.addWordTitleGerman')
    : t('features.language.addWord');

  const breadcrumbs = useMemo(
    () => [
      { label: t('common.home'), path: '/app' },
      { label: t('tribes.title'), path: '/app/tribes' },
      { label: tribe?.name || t('common.loading'), path: `/app/tribes/${tribeId}` },
      { label: project?.name || t('common.loading'), path: `/app/tribes/${tribeId}/projects/${projectId}` },
      { label: detail ? detail.title : t('common.loading'), path: lessonPath },
      { label: isEdit ? t('features.language.editWord') : addWordLabel },
    ],
    [tribe?.name, project?.name, detail, tribeId, projectId, lessonPath, isEdit, addWordLabel, t],
  );

  if (loading || !detail || !settings || (isEdit && !word)) {
    return (
      <AppLayout breadcrumbs={breadcrumbs} menuActions={menuActions}>
        {error ? <div style={errorStyle}>{error}</div> : (
          <div style={{ display: 'flex', justifyContent: 'center', padding: '48px' }}>
            <ThemedLoadingSpinner size="sm" />
          </div>
        )}
      </AppLayout>
    );
  }

  return (
    <AppLayout breadcrumbs={breadcrumbs} menuActions={menuActions}>
      <ThemedSection themeId="main_1">
        {isEdit && word ? (
          <EditWordForm lessonTitle={detail.title} word={word} languages={languages} onUpdateWord={updateWord} onDone={backToLesson} />
        ) : (
          <AddWordForm
            lessonTitle={detail.title}
            languageSettings={settings}
            languages={languages}
            onAddExisting={addExisting}
            onCreateWord={createWord}
          />
        )}
      </ThemedSection>
    </AppLayout>
  );
};

export const WordFormPage: React.FC = () => (
  <ThemeProvider defaultTheme="default">
    <WordFormPageContent />
  </ThemeProvider>
);
