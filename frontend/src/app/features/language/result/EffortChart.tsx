import { useTheme } from '@/app/platform/core/layout/themes/ThemeContext.tsx';

import React from 'react';
import { useTranslation } from 'react-i18next';
import { Bar, BarChart, ResponsiveContainer } from 'recharts';

import { CORRECT_COLOR, WRONG_COLOR } from '../shared/attemptColors.ts';
import {
  CHART_HEIGHT, CHART_MARGIN, dayTimestamp, gridElement, timeAxisElement, tooltipElement, valueAxisElement,
} from './chartCommon.tsx';
import PeriodChartFrame from './PeriodChartFrame.tsx';
import { EffortDay } from './types.ts';

interface Props {
  days: EffortDay[];
}

const round = (value: number) => Number(value.toFixed(1));

// One bar per day, split between the successes (bottom) and the errors (top), both weighted by importance.
const EffortChart: React.FC<Props> = ({ days }) => {
  const { t } = useTranslation();
  const { theme } = useTheme();
  const colors = theme.colors;
  const names: Record<string, string> = { success: t('features.language.effortSuccess'), errors: t('features.language.effortErrors') };

  return (
    <PeriodChartFrame items={days}>
      {(visible) => (
        <>
          <div role="img" aria-label={t('features.language.effortOverTime')}>
            <ResponsiveContainer width="100%" height={CHART_HEIGHT}>
              <BarChart data={visible.map((d) => ({ ...d, t: dayTimestamp(d.date) }))} margin={CHART_MARGIN}>
                {gridElement(colors)}
                {timeAxisElement(colors, true)}
                {valueAxisElement(colors, (v) => String(round(v)))}
                {tooltipElement((value, name) => [String(round(value)), names[name] ?? name])}
                <Bar dataKey="success" stackId="effort" fill={CORRECT_COLOR} isAnimationActive={false} />
                <Bar dataKey="errors" stackId="effort" fill={WRONG_COLOR} isAnimationActive={false} />
              </BarChart>
            </ResponsiveContainer>
          </div>
          <Legend names={names} />
        </>
      )}
    </PeriodChartFrame>
  );
};

const Legend: React.FC<{ names: Record<string, string> }> = ({ names }) => {
  const items = [
    { color: CORRECT_COLOR, label: names.success },
    { color: WRONG_COLOR, label: names.errors },
  ];

  return (
    <div style={{ display: 'flex', gap: '12px', fontSize: 'var(--font-sm)' }}>
      {items.map(({ color, label }) => (
        <span key={label} style={{ display: 'inline-flex', alignItems: 'center', gap: '4px' }}>
          <span style={{ width: 10, height: 10, background: color, borderRadius: 2 }} />
          {label}
        </span>
      ))}
    </div>
  );
};

export default EffortChart;
