import { useTheme } from '@/app/platform/core/layout/themes/ThemeContext.tsx';

import React from 'react';
import { useTranslation } from 'react-i18next';
import { Line, LineChart, ResponsiveContainer } from 'recharts';

import {
  CHART_HEIGHT, CHART_MARGIN, dayTimestamp, formatPercent, gridElement, timeAxisElement, tooltipElement, valueAxisElement,
} from './chartCommon.tsx';
import PeriodChartFrame from './PeriodChartFrame.tsx';
import { ScoreHistoryPoint } from './types.ts';

interface Props {
  points: ScoreHistoryPoint[];
}

const percentTick = (ratio: number) => `${Math.round(ratio * 100)}%`;

// The lesson's overall score over time (0-100%), with a period selector to reduce the duration shown.
const ScoreChart: React.FC<Props> = ({ points }) => {
  const { t } = useTranslation();
  const { theme } = useTheme();
  const colors = theme.colors;

  return (
    <PeriodChartFrame items={points}>
      {(visible) => (
        <div role="img" aria-label={t('features.language.scoreOverTime')}>
          <ResponsiveContainer width="100%" height={CHART_HEIGHT}>
            <LineChart data={visible.map((p) => ({ t: dayTimestamp(p.date), score: p.score }))} margin={CHART_MARGIN}>
              {gridElement(colors)}
              {timeAxisElement(colors, true)}
              {valueAxisElement(colors, percentTick, [0, 1])}
              {tooltipElement((value) => [formatPercent(value), t('features.language.scoreOverTime')])}
              <Line type="linear" dataKey="score" stroke={colors.primary} strokeWidth={2} dot={{ r: 3, fill: colors.primary }} isAnimationActive={false} />
            </LineChart>
          </ResponsiveContainer>
        </div>
      )}
    </PeriodChartFrame>
  );
};

export default ScoreChart;
