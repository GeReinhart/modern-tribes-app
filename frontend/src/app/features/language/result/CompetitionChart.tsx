import { useTheme } from '@/app/platform/core/layout/themes/ThemeContext.tsx';

import React from 'react';
import { useTranslation } from 'react-i18next';
import { Line, LineChart, ResponsiveContainer } from 'recharts';

import {
  CHART_HEIGHT, CHART_MARGIN, DAY_KEY, dayAxisElement, formatPercent, gridElement, tooltipElement, valueAxisElement,
} from './chartCommon.tsx';
import { memberColor } from './memberColors.ts';
import PeriodChartFrame from './PeriodChartFrame.tsx';
import { CompetitionMember } from './types.ts';

interface Props {
  members: CompetitionMember[];
}

const AXIS_STEP = 0.05;

const percentTick = (ratio: number) => `${Number((ratio * 100).toFixed(1))}%`;

// The top of the score axis: just above the best score shown, so low scores are not squeezed at the bottom.
const scoreAxisMax = (members: CompetitionMember[], dates: string[]): number => {
  const shown = new Set(dates);
  const best = Math.max(0, ...members.flatMap((m) => m.points.filter((p) => shown.has(p.date)).map((p) => p.score)));
  return Math.min(1, Math.max(AXIS_STEP, Math.ceil(best / AXIS_STEP) * AXIS_STEP));
};

// One row per day, holding each member's score under the member's id (a member without a score that day has no key).
const rowsForDates = (members: CompetitionMember[], dates: string[]) =>
  dates.map((date) => {
    const row: Record<string, number | string> = { [DAY_KEY]: date };
    members.forEach((m) => {
      const point = m.points.find((p) => p.date === date);
      if (point) row[m.user_id] = point.score;
    });
    return row;
  });

// Every member's overall score over time on a single chart, one color per member.
const CompetitionChart: React.FC<Props> = ({ members }) => {
  const { t } = useTranslation();
  const { theme } = useTheme();
  const colors = theme.colors;
  const names = Object.fromEntries(members.map((m) => [m.user_id, m.name]));
  const dates = [...new Set(members.flatMap((m) => m.points.map((p) => p.date)))].sort().map((date) => ({ date }));

  return (
    <PeriodChartFrame items={dates}>
      {(visible) => (
        <div role="img" aria-label={t('features.language.competitionOverTime')}>
          <ResponsiveContainer width="100%" height={CHART_HEIGHT}>
            <LineChart data={rowsForDates(members, visible.map((d) => d.date))} margin={CHART_MARGIN}>
              {gridElement(colors)}
              {dayAxisElement(colors, true)}
              {valueAxisElement(colors, percentTick, [0, scoreAxisMax(members, visible.map((d) => d.date))])}
              {tooltipElement((value, name) => [formatPercent(value), names[name] ?? name])}
              {members.map((member, index) => (
                <Line
                  key={member.user_id}
                  type="linear"
                  dataKey={member.user_id}
                  stroke={memberColor(index)}
                  strokeWidth={2}
                  dot={{ r: 3, fill: memberColor(index) }}
                  connectNulls
                  isAnimationActive={false}
                />
              ))}
            </LineChart>
          </ResponsiveContainer>
        </div>
      )}
    </PeriodChartFrame>
  );
};

export default CompetitionChart;
