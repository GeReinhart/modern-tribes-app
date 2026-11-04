import { useTheme } from '@/app/platform/core/layout/themes/ThemeContext.tsx';

import React from 'react';
import { useTranslation } from 'react-i18next';

import ChartGrid from './ChartGrid.tsx';
import { HEIGHT, WIDTH, xForIndex, yForRatio } from './chartLayout.ts';
import PeriodChartFrame from './PeriodChartFrame.tsx';
import { ScoreHistoryPoint } from './types.ts';

interface Props {
  points: ScoreHistoryPoint[];
}

const SCORE_LEVELS = [0, 0.5, 1].map((ratio) => ({ ratio, label: `${Math.round(ratio * 100)}%` }));

// The lesson's overall score over time (0-100%), with a period selector to reduce the duration shown.
const ScoreChart: React.FC<Props> = ({ points }) => {
  const { t } = useTranslation();
  const { theme } = useTheme();

  return (
    <PeriodChartFrame items={points}>
      {(visible) => (
        <svg viewBox={`0 0 ${WIDTH} ${HEIGHT}`} role="img" aria-label={t('features.language.scoreOverTime')} style={{ width: '100%', height: 'auto' }}>
          <ChartGrid levels={SCORE_LEVELS} firstDate={visible[0].date} lastDate={visible[visible.length - 1].date} />
          <polyline
            points={visible.map((p, i) => `${xForIndex(i, visible.length)},${yForRatio(p.score)}`).join(' ')}
            fill="none"
            stroke={theme.colors.primary}
            strokeWidth="2"
          />
          {visible.map((p, i) => (
            <circle key={p.date} cx={xForIndex(i, visible.length)} cy={yForRatio(p.score)} r="3" fill={theme.colors.primary}>
              <title>{`${p.date} — ${(p.score * 100).toFixed(1)}%`}</title>
            </circle>
          ))}
        </svg>
      )}
    </PeriodChartFrame>
  );
};

export default ScoreChart;
