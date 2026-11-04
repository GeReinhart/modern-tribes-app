import { useTheme } from '@/app/platform/core/layout/themes/ThemeContext.tsx';

import React from 'react';
import { useTranslation } from 'react-i18next';

import ChartGrid from './ChartGrid.tsx';
import { HEIGHT, WIDTH, xForDate, yForRatio } from './chartLayout.ts';
import { memberColor } from './memberColors.ts';
import PeriodChartFrame from './PeriodChartFrame.tsx';
import { CompetitionMember } from './types.ts';

interface Props {
  members: CompetitionMember[];
}

const SCORE_LEVELS = [0, 0.5, 1].map((ratio) => ({ ratio, label: `${Math.round(ratio * 100)}%` }));
const formatScore = (score: number) => `${(score * 100).toFixed(1)}%`;

// Every member's overall score over time on a single chart, one color per member, with a legend.
const CompetitionChart: React.FC<Props> = ({ members }) => {
  const { t } = useTranslation();
  const dates = [...new Set(members.flatMap((m) => m.points.map((p) => p.date)))].sort().map((date) => ({ date }));

  return (
    <PeriodChartFrame items={dates}>
      {(visible) => {
        const [first, last] = [visible[0].date, visible[visible.length - 1].date];
        return (
          <>
            <svg viewBox={`0 0 ${WIDTH} ${HEIGHT}`} role="img" aria-label={t('features.language.competitionOverTime')} style={{ width: '100%', height: 'auto' }}>
              <ChartGrid levels={SCORE_LEVELS} firstDate={first} lastDate={last} />
              {members.map((member, index) => (
                <MemberLine key={member.user_id} member={member} color={memberColor(index)} first={first} last={last} />
              ))}
            </svg>
            <MembersLegend members={members} />
          </>
        );
      }}
    </PeriodChartFrame>
  );
};

const MemberLine: React.FC<{ member: CompetitionMember; color: string; first: string; last: string }> = ({ member, color, first, last }) => {
  const points = member.points.filter((p) => p.date >= first && p.date <= last);
  const coords = points.map((p) => `${xForDate(p.date, first, last)},${yForRatio(p.score)}`).join(' ');

  return (
    <g>
      <polyline points={coords} fill="none" stroke={color} strokeWidth="2" />
      {points.map((p) => (
        <circle key={p.date} cx={xForDate(p.date, first, last)} cy={yForRatio(p.score)} r="3" fill={color}>
          <title>{`${member.name} — ${p.date} — ${formatScore(p.score)}`}</title>
        </circle>
      ))}
    </g>
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
          <span style={{ color: theme.colors.secondary }}>{formatScore(member.points[member.points.length - 1].score)}</span>
        </span>
      ))}
    </div>
  );
};

export default CompetitionChart;
