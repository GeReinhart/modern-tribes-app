import React from 'react';

import CompetitionChart from './CompetitionChart.tsx';
import CompetitionRanking from './CompetitionRanking.tsx';
import ResultLoading from './ResultLoading.tsx';
import { useCompetition } from './useCompetition.ts';

// The "Competition" results: the ranking of every member, then their overall scores over time on one chart.
const CompetitionPanel: React.FC<{ lessonId: string; refreshKey: string }> = ({ lessonId, refreshKey }) => {
  const { data, loading } = useCompetition(lessonId, refreshKey);

  return (
    <ResultLoading loading={loading}>
      <div style={{ display: 'grid', gap: '16px' }}>
        <CompetitionRanking members={data} />
        <CompetitionChart members={data} />
      </div>
    </ResultLoading>
  );
};

export default CompetitionPanel;
