import { useTheme } from '@/app/platform/core/layout/themes/ThemeContext.tsx';

import React from 'react';

import { INTERVAL_LABELS } from './chordTheory.ts';

interface IntervalMarkerProps {
  semitone: number;
  size?: number;
}

export const IntervalMarker: React.FC<IntervalMarkerProps> = ({ semitone, size = 26 }) => {
  const { theme } = useTheme();
  const isRoot = semitone === 0;
  const fontSize = INTERVAL_LABELS[semitone].length > 2 ? size * 0.34 : size * 0.4;

  return (
    <div
      style={{
        width: size,
        height: size,
        borderRadius: '50%',
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'center',
        backgroundColor: isRoot ? theme.colors.text : theme.colors.ghost,
        border: `1px solid ${theme.colors.border}`,
        color: isRoot ? theme.colors.surface : theme.colors.text,
        fontSize: `${fontSize}px`,
        fontWeight: 700,
        lineHeight: 1,
        flexShrink: 0,
      }}
    >
      {INTERVAL_LABELS[semitone]}
    </div>
  );
};

export const MutedMarker: React.FC<{ size?: number }> = ({ size = 26 }) => {
  const { theme } = useTheme();
  return (
    <div
      style={{
        width: size,
        height: size,
        borderRadius: '50%',
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'center',
        border: `1px dashed ${theme.colors.secondary}`,
        color: theme.colors.secondary,
        fontSize: `${size * 0.4}px`,
        fontWeight: 700,
        lineHeight: 1,
        flexShrink: 0,
      }}
    >
      X
    </div>
  );
};
