import { usePersistedString } from '@/app/platform/core/browser/usePersistedString.ts';
import { ThemedTabs } from '@/app/platform/core/layout/themes/components/ThemedTabs.tsx';

import React, { useState } from 'react';
import { useTranslation } from 'react-i18next';

import CompetitionPanel from './CompetitionPanel.tsx';
import EffortPanel from './EffortPanel.tsx';
import GlobalScorePanel from './GlobalScorePanel.tsx';
import ResultsPersonSelect from './ResultsPersonSelect.tsx';
import { RESULTS_SUB_TAB_STORAGE_KEY, RESULTS_SUB_TABS, ResultsSubTab } from './resultsSubTabs.ts';
import { useResultMembers } from './useResultMembers.ts';
import WordResultsPanel from './WordResultsPanel.tsx';
import { Language, Word } from '../shared/types.ts';

interface Props {
  lessonId: string;
  words: Word[];
  languages: Language[];
}

const TAB_LABEL_KEYS: Record<ResultsSubTab, string> = {
  words: 'features.language.resultsTabWords',
  global: 'features.language.resultsTabGlobal',
  effort: 'features.language.resultsTabEffort',
  competition: 'features.language.resultsTabCompetition',
};

// The "Result" sub-tab, itself split in four: results by word, overall score, effort and competition.
// The person picked (the signed-in user by default) is shared by every sub-tab but the competition.
const ResultsPanel: React.FC<Props> = ({ lessonId, words, languages }) => {
  const { t } = useTranslation();
  const members = useResultMembers(lessonId);
  const [selectedUserId, setSelectedUserId] = useState<string | undefined>(undefined);
  const [subTab, setSubTab] = usePersistedString(RESULTS_SUB_TAB_STORAGE_KEY, RESULTS_SUB_TABS, 'words');
  const showsPerson = subTab !== 'competition';

  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: '12px' }}>
      <ThemedTabs
        tabs={RESULTS_SUB_TABS.map((key) => ({ key, label: t(TAB_LABEL_KEYS[key]) }))}
        activeTab={subTab}
        onTabChange={(key) => setSubTab(key as ResultsSubTab)}
      />
      {showsPerson && <ResultsPersonSelect members={members} selectedUserId={selectedUserId} onChange={setSelectedUserId} />}
      {subTab === 'words' && <WordResultsPanel lessonId={lessonId} words={words} languages={languages} userId={selectedUserId} />}
      {subTab === 'global' && <GlobalScorePanel lessonId={lessonId} userId={selectedUserId} />}
      {subTab === 'effort' && <EffortPanel lessonId={lessonId} userId={selectedUserId} />}
      {subTab === 'competition' && <CompetitionPanel lessonId={lessonId} />}
    </div>
  );
};

export default ResultsPanel;
