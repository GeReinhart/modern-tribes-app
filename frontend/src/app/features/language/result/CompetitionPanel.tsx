import React from 'react';

import CompetitionChart from './CompetitionChart.tsx';
import { useCompetition } from './useCompetition.ts';

// The "Competition" results: every member's overall score over time on one chart.
const CompetitionPanel: React.FC<{ lessonId: string }> = ({ lessonId }) => (
  <CompetitionChart members={useCompetition(lessonId)} />
);

export default CompetitionPanel;
