import { useTheme } from '@/app/platform/core/layout/themes/ThemeContext.tsx';

import React from 'react';

const HOUR_H = 64;

interface Props {
  startH: number;
  endH: number;
}

// The hour-of-day gutter shown once to the left of the timeline, shared by
// the single-day view and the week grid (one column of hours for all 7 days).
const HourLabelsGutter: React.FC<Props> = ({ startH, endH }) => {
  const { theme } = useTheme();
  const visibleHours = Array.from({ length: endH - startH + 1 }, (_, i) => startH + i);

  return (
    <div style={{ width: 44, flexShrink: 0, position: 'relative' }}>
      {visibleHours.map(h => (
        <span
          key={h}
          style={{
            position: 'absolute', top: (h - startH) * HOUR_H - 9,
            right: 6, fontSize: '12px', fontWeight: 600,
            color: theme.colors.text, lineHeight: 1, userSelect: 'none',
            opacity: 0.7,
          }}
        >
          {String(h).padStart(2, '0')}
        </span>
      ))}
    </div>
  );
};

export default HourLabelsGutter;
