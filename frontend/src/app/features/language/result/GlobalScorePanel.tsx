import { useTheme } from '@/app/platform/core/layout/themes/ThemeContext.tsx';

import React from 'react';

import ScoreChart from './ScoreChart.tsx';
import ScoreExplanation from './ScoreExplanation.tsx';
import { useMemberScore } from './useMemberScore.ts';
import { useScoreHistory } from './useScoreHistory.ts';

interface Props {
  lessonId: string;
  userId?: string;
}

const formatOverall = (score: number) => `${(score * 100).toFixed(2)}%`;

// The "Overall score" results of one person: the big score, how it evolved, and how it is calculated.
const GlobalScorePanel: React.FC<Props> = ({ lessonId, userId }) => {
  const { theme } = useTheme();
  const scoreData = useMemberScore(lessonId, userId);
  const history = useScoreHistory(lessonId, userId);

  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: '12px' }}>
      <div style={{ textAlign: 'center', fontSize: '3rem', fontWeight: 700, color: theme.colors.primary }}>
        {formatOverall(scoreData?.overall_score ?? 0)}
      </div>
      <ScoreChart points={history} />
      <ScoreExplanation />
    </div>
  );
};

export default GlobalScorePanel;
