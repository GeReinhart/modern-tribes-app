import { useTheme } from '@/app/platform/core/layout/themes/ThemeContext.tsx';

import React from 'react';
import { useTranslation } from 'react-i18next';
import { Line, LineChart, ResponsiveContainer } from 'recharts';

import {
  CHART_HEIGHT, CHART_MARGIN, dayTimestamp, formatPercent, gridElement, timeAxisElement, tooltipElement, valueAxisElement,
} from './chartCommon.tsx';
import { memberColor } from './memberColors.ts';
import PeriodChartFrame from './PeriodChartFrame.tsx';
import { CompetitionMember } from './types.ts';

interface Props {
  members: CompetitionMember[];
}

const percentTick = (ratio: number) => `${Math.round(ratio * 100)}%`;

// One row per day, holding each member's score under the member's id (a member without a score that day has no key).
const rowsForDates = (members: CompetitionMember[], dates: string[]) =>
  dates.map((date) => {
    const row: Record<string, number> = { t: dayTimestamp(date) };
    members.forEach((m) => {
      const point = m.points.find((p) => p.date === date);
      if (point) row[m.user_id] = point.score;
    });
    return row;
  });

// Every member's overall score over time on a single chart, one color per member, with a legend.
const CompetitionChart: React.FC<Props> = ({ members }) => {
  const { t } = useTranslation();
  const { theme } = useTheme();
  const colors = theme.colors;
  const names = Object.fromEntries(members.map((m) => [m.user_id, m.name]));
  const dates = [...new Set(members.flatMap((m) => m.points.map((p) => p.date)))].sort().map((date) => ({ date }));

  return (
    <PeriodChartFrame items={dates}>
      {(visible) => (
        <>
          <div role="img" aria-label={t('features.language.competitionOverTime')}>
            <ResponsiveContainer width="100%" height={CHART_HEIGHT}>
              <LineChart data={rowsForDates(members, visible.map((d) => d.date))} margin={CHART_MARGIN}>
                {gridElement(colors)}
                {timeAxisElement(colors, true)}
                {valueAxisElement(colors, percentTick, [0, 1])}
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
          <MembersLegend members={members} />
        </>
      )}
    </PeriodChartFrame>
  );
};

const MembersLegend: React.FC<{ members: CompetitionMember[] }> = ({ members }) => {
  const { theme } = useTheme();

  return (
    <div style={{ display: 'flex', flexWrap: 'wrap', gap: '6px 16px', fontSize: 'var(--font-sm)' }}>
      {members.map((member, index) => (
        <span key={member.user_id} style={{ display: 'inline-flex', alignItems: 'center', gap: '4px' }}>
          <span style={{ width: 10, height: 10, background: memberColor(index), borderRadius: 2 }} />
          {member.name}
          <span style={{ color: theme.colors.secondary }}>{formatPercent(member.points[member.points.length - 1].score)}</span>
        </span>
      ))}
    </div>
  );
};

export default CompetitionChart;
