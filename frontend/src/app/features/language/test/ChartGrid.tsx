import { useTheme } from '@/app/platform/core/layout/themes/ThemeContext.tsx';

import React from 'react';

import { HEIGHT, PAD, WIDTH, yForRatio } from './chartLayout.ts';

interface Props {
  levels: { ratio: number; label: string }[];
  firstDate: string;
  lastDate: string;
}

// The dashed horizontal guides with their labels, and the first and last date under the plot.
const ChartGrid: React.FC<Props> = ({ levels, firstDate, lastDate }) => {
  const { theme } = useTheme();

  return (
    <>
      {levels.map(({ ratio, label }) => (
        <g key={ratio}>
          <line x1={PAD.left} x2={WIDTH - PAD.right} y1={yForRatio(ratio)} y2={yForRatio(ratio)} stroke={theme.colors.border} strokeDasharray="3 3" />
          <text x={PAD.left - 6} y={yForRatio(ratio) + 4} textAnchor="end" fontSize="10" fill={theme.colors.secondary}>{label}</text>
        </g>
      ))}
      <text x={PAD.left} y={HEIGHT - 6} fontSize="10" fill={theme.colors.secondary}>{firstDate}</text>
      <text x={WIDTH - PAD.right} y={HEIGHT - 6} textAnchor="end" fontSize="10" fill={theme.colors.secondary}>{lastDate}</text>
    </>
  );
};

export default ChartGrid;
