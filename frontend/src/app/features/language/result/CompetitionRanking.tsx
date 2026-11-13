import { useTheme } from '@/app/platform/core/layout/themes/ThemeContext.tsx';

import React from 'react';
import { useTranslation } from 'react-i18next';

import { formatPercent } from './chartCommon.tsx';
import { memberColor } from './memberColors.ts';
import { CompetitionMember } from './types.ts';

interface RankedMember {
  member: CompetitionMember;
  color: string;
  score: number;
}

const latestScore = (member: CompetitionMember): number => member.points[member.points.length - 1].score;

// Best score first; ties are broken alphabetically. The color index is the member's position in the chart.
const rankMembers = (members: CompetitionMember[]): RankedMember[] =>
  members
    .map((member, index) => ({ member, color: memberColor(index), score: latestScore(member) }))
    .sort((a, b) => b.score - a.score || a.member.name.localeCompare(b.member.name));

// A bar filled in proportion to the score, in the member's chart color.
const ScoreBar: React.FC<{ score: number; color: string }> = ({ score, color }) => {
  const { theme } = useTheme();

  return (
    <div style={{ height: 6, background: theme.colors.border, borderRadius: 3, overflow: 'hidden' }}>
      <div style={{ width: `${Math.round(score * 100)}%`, height: '100%', background: color }} />
    </div>
  );
};

const RankingRow: React.FC<{ rank: number; ranked: RankedMember }> = ({ rank, ranked: { member, color, score } }) => {
  const { theme } = useTheme();

  return (
    <li style={{ display: 'grid', gap: '4px' }}>
      <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
        <strong style={{ minWidth: '1.5em' }}>{rank}</strong>
        <span style={{ width: 10, height: 10, background: color, borderRadius: 2 }} />
        <span style={{ flex: 1 }}>{member.name}</span>
        <span style={{ color: theme.colors.secondary }}>{formatPercent(score)}</span>
      </div>
      <ScoreBar score={score} color={color} />
    </li>
  );
};

// The members ordered by their current overall score, each with the color of their chart line.
const CompetitionRanking: React.FC<{ members: CompetitionMember[] }> = ({ members }) => {
  const { t } = useTranslation();

  if (members.length === 0) return null;

  return (
    <ol aria-label={t('features.language.competitionRanking')} style={{ listStyle: 'none', margin: 0, padding: 0, display: 'grid', gap: '10px' }}>
      {rankMembers(members).map((ranked, index) => (
        <RankingRow key={ranked.member.user_id} rank={index + 1} ranked={ranked} />
      ))}
    </ol>
  );
};

export default CompetitionRanking;
