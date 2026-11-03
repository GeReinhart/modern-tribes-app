import { ThemedConfirmDialog } from '@/app/platform/core/layout/themes/components/ThemedConfirmDialog.tsx';
import { ThemedLoadingSpinner } from '@/app/platform/core/layout/themes/components/ThemedLoadingSpinner.tsx';
import { ThemedText } from '@/app/platform/core/layout/themes/components/ThemedText.tsx';

import React, { useState } from 'react';
import { useTranslation } from 'react-i18next';
import { useNavigate } from 'react-router-dom';

import LessonDocumentSection from './LessonDocumentSection.tsx';
import { useLessonMutations } from './useLessonMutations.ts';
import { useLessonWords } from './useLessonWords.ts';
import { editWordPath } from './wordFormRoutes.ts';
import { useLessonDetail } from '../shared/useLessonDetail.ts';
import { useLanguages } from '../shared/useLanguages.ts';
import LessonSubTabs from '../shared/LessonSubTabs.tsx';
import { LessonSubTab } from '../shared/lessonSubTabs.ts';
import VocabularyTab from '../shared/VocabularyTab.tsx';
import { LanguageSettings } from '../shared/types.ts';

interface Props {
  lessonId: string;
  canEdit: boolean;
  languageSettings: LanguageSettings;
  tribeId: string;
  projectId: string;
  featureInstanceId: string;
  subTab: LessonSubTab;
  onSubTabChange: (subTab: LessonSubTab) => void;
  onLessonUpdated?: () => void;
}

const LessonDetailPanel: React.FC<Props> = ({
  lessonId, canEdit, tribeId, projectId, featureInstanceId, subTab, onSubTabChange, onLessonUpdated,
}) => {
  const { t } = useTranslation();
  const navigate = useNavigate();
  const [wordToRemoveId, setWordToRemoveId] = useState<string | null>(null);
  const { detail, loading, error, refetch } = useLessonDetail(lessonId);
  const { updateTitle, updateDocument, error: lessonError } = useLessonMutations(lessonId, refetch, onLessonUpdated);
  const { languages } = useLanguages();
  const { removeWord, error: wordsError } = useLessonWords(lessonId, refetch);

  const confirmRemoveWord = async () => {
    if (wordToRemoveId && await removeWord(wordToRemoveId)) onLessonUpdated?.();
    setWordToRemoveId(null);
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
      <LessonSubTabs active={subTab} onChange={onSubTabChange} />
      {(lessonError || wordsError) && <ThemedText variant="danger" size="small">{lessonError || wordsError}</ThemedText>}
      {subTab === 'lesson' ? (
        <LessonDocumentSection
          lessonId={lessonId}
          title={detail.title}
          documentContent={detail.document.content}
          canEdit={canEdit}
          onUpdateTitle={updateTitle}
          onUpdateDocument={updateDocument}
        />
      ) : (
        <VocabularyTab
          words={detail.words}
          languages={languages}
          onEditWord={canEdit ? (wordId) => navigate(editWordPath(tribeId, projectId, featureInstanceId, lessonId, wordId)) : undefined}
          onRemoveWord={canEdit ? setWordToRemoveId : undefined}
        />
      )}
      <ThemedConfirmDialog
        isOpen={wordToRemoveId !== null}
        onClose={() => setWordToRemoveId(null)}
        onConfirm={confirmRemoveWord}
        title={t('features.language.removeWordFromLesson')}
        message={t('features.language.removeWordFromLessonConfirm')}
        confirmText={t('features.language.removeWordFromLesson')}
        cancelText={t('common.cancel')}
      />
    </div>
  );
};

export default LessonDetailPanel;
