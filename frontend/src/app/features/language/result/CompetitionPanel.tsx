import React from 'react';

import CompetitionChart from './CompetitionChart.tsx';
import ResultLoading from './ResultLoading.tsx';
import { useCompetition } from './useCompetition.ts';

// The "Competition" results: every member's overall score over time on one chart.
const CompetitionPanel: React.FC<{ lessonId: string }> = ({ lessonId }) => {
  const { data, loading } = useCompetition(lessonId);

  return <ResultLoading loading={loading}><CompetitionChart members={data} /></ResultLoading>;
};

export default CompetitionPanel;
