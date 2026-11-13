import { usePersistedString } from '@/app/platform/core/browser/usePersistedString.ts';
import { ThemedLoadingSpinner } from '@/app/platform/core/layout/themes/components/ThemedLoadingSpinner.tsx';
import { ThemedText } from '@/app/platform/core/layout/themes/components/ThemedText.tsx';

import React from 'react';

import ResultsPanel from './ResultsPanel.tsx';
import { RESULTS_SUB_TAB_STORAGE_KEY, RESULTS_SUB_TABS } from './resultsSubTabs.ts';
import { useCompetitionParticipation } from './useCompetitionParticipation.ts';
import { useResultMenuActions } from './useResultMenuActions.ts';
import { useLanguages } from '../shared/useLanguages.ts';
import { useLessonDetail } from '../shared/useLessonDetail.ts';

// One lesson's results page: its title, then the sub-tabs of ResultsPanel. Its menu actions (back to
// lessons, join or leave the competition) are registered here, not rendered.
const ResultLessonView: React.FC<{ lessonId: string; onBack: () => void }> = ({ lessonId, onBack }) => {
  const { detail, loading, error } = useLessonDetail(lessonId);
  const { languages } = useLanguages();
  const [subTab, setSubTab] = usePersistedString(RESULTS_SUB_TAB_STORAGE_KEY, RESULTS_SUB_TABS, 'words');
  const participation = useCompetitionParticipation(lessonId);
  useResultMenuActions({ subTab: subTab, participation, onBack });

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
        <ResultsPanel
          lessonId={lessonId}
          words={detail.words}
          languages={languages}
          subTab={subTab}
          onSubTabChange={setSubTab}
          competitionKey={String(participation.participates)}
        />
      </div>
    </div>
  );
};

export default ResultLessonView;
