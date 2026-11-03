import { ThemedFilterPill } from '@/app/platform/core/layout/themes/components/ThemedFilterPill.tsx';
import { ThemedText } from '@/app/platform/core/layout/themes/components/ThemedText.tsx';
import { useTheme } from '@/app/platform/core/layout/themes/ThemeContext.tsx';

import React, { useState } from 'react';
import { useTranslation } from 'react-i18next';

import { CHART_PERIODS, ChartPeriodKey, pointsInPeriod } from './scoreChartPeriods.ts';
import { ScoreHistoryPoint } from './types.ts';

interface Props {
  points: ScoreHistoryPoint[];
}

const WIDTH = 600;
const HEIGHT = 180;
const PAD = { left: 36, right: 12, top: 10, bottom: 22 };

const xFor = (index: number, count: number) =>
  PAD.left + (count <= 1 ? (WIDTH - PAD.left - PAD.right) / 2 : (index / (count - 1)) * (WIDTH - PAD.left - PAD.right));
const yFor = (score: number) => PAD.top + (1 - score) * (HEIGHT - PAD.top - PAD.bottom);

// The lesson's overall score over time (0-100%), with a period selector to reduce the duration shown.
const ScoreChart: React.FC<Props> = ({ points }) => {
  const { t } = useTranslation();
  const { theme } = useTheme();
  const [periodKey, setPeriodKey] = useState<ChartPeriodKey>('all');
  const period = CHART_PERIODS.find((p) => p.key === periodKey) ?? CHART_PERIODS[CHART_PERIODS.length - 1];
  const visible = pointsInPeriod(points, period.days);
  const path = visible.map((p, i) => `${xFor(i, visible.length)},${yFor(p.score)}`).join(' ');

  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: '8px' }}>
      <div style={{ display: 'flex', flexWrap: 'wrap', gap: '6px' }}>
        {CHART_PERIODS.map((p) => (
          <ThemedFilterPill
            key={p.key}
            label={t(`features.language.chartPeriod.${p.key}`)}
            color={theme.colors.primary}
            active={p.key === periodKey}
            onClick={() => setPeriodKey(p.key)}
          />
        ))}
      </div>
      {visible.length === 0 ? (
        <ThemedText variant="secondary" size="small">{t('features.language.noChartData')}</ThemedText>
      ) : (
        <svg viewBox={`0 0 ${WIDTH} ${HEIGHT}`} role="img" aria-label={t('features.language.scoreOverTime')} style={{ width: '100%', height: 'auto' }}>
          {[0, 0.5, 1].map((level) => (
            <g key={level}>
              <line x1={PAD.left} x2={WIDTH - PAD.right} y1={yFor(level)} y2={yFor(level)} stroke={theme.colors.border} strokeDasharray="3 3" />
              <text x={PAD.left - 6} y={yFor(level) + 4} textAnchor="end" fontSize="10" fill={theme.colors.secondary}>{Math.round(level * 100)}%</text>
            </g>
          ))}
          <polyline points={path} fill="none" stroke={theme.colors.primary} strokeWidth="2" />
          {visible.map((p, i) => (
            <circle key={p.date} cx={xFor(i, visible.length)} cy={yFor(p.score)} r="3" fill={theme.colors.primary}>
              <title>{`${p.date} — ${(p.score * 100).toFixed(1)}%`}</title>
            </circle>
          ))}
          <text x={PAD.left} y={HEIGHT - 6} fontSize="10" fill={theme.colors.secondary}>{visible[0].date}</text>
          <text x={WIDTH - PAD.right} y={HEIGHT - 6} textAnchor="end" fontSize="10" fill={theme.colors.secondary}>{visible[visible.length - 1].date}</text>
        </svg>
      )}
    </div>
  );
};

export default ScoreChart;
