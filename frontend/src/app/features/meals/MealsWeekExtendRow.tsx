import { useTheme } from '@/app/platform/core/layout/themes/ThemeContext.tsx';

import React from 'react';

interface Props {
  onExpand: () => void;
  onCollapse: () => void;
  canExpand: boolean;
  canCollapse: boolean;
  columnCount: number;
  gridRow: number;
}

// The +/- row shown before the first day and after the last day of the meals week grid, letting
// the user grow or shrink the displayed period one day at a time at that edge. gridRow is passed
// explicitly (rather than relying on grid auto-placement) so this full-width row can never land
// on the same row as a day's cells and intercept clicks meant for them.
const MealsWeekExtendRow: React.FC<Props> = ({ onExpand, onCollapse, canExpand, canCollapse, columnCount, gridRow }) => {
  const { theme } = useTheme();
  const buttonStyle = {
    border: `1px solid ${theme.colors.border}`, background: 'transparent', cursor: 'pointer',
    color: theme.colors.text, borderRadius: '6px', width: '24px', height: '20px', fontSize: 'var(--font-xs)',
  };
  return (
    <div style={{ gridRow, gridColumn: `1 / span ${columnCount}`, display: 'flex', justifyContent: 'center', gap: '6px' }}>
      {canCollapse && <button type="button" onClick={onCollapse} style={buttonStyle}>−</button>}
      {canExpand && <button type="button" onClick={onExpand} style={buttonStyle}>+</button>}
    </div>
  );
};

export default MealsWeekExtendRow;
