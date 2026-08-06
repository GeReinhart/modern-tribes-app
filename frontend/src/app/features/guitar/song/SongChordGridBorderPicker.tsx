import { useTheme } from '@/app/platform/core/layout/themes/ThemeContext.tsx';

import React from 'react';
import { useTranslation } from 'react-i18next';

import { ChordGridCell } from './types.ts';

type BorderSide = 'border_top' | 'border_right' | 'border_bottom' | 'border_left';

const MIN_SQUARE_SIZE = 80;
const HIT_AREA_THICKNESS = 16;
// Off is a faint hairline, on is a thick, high-contrast bar -- differing only in color (as the
// first version did) wasn't enough to tell the two states apart at a glance.
const OFF_BAR_THICKNESS = 2;
const ON_BAR_THICKNESS = 8;

const LABEL_KEYS: Record<BorderSide, string> = {
  border_top: 'guitarSong.chordGrid.borderTop',
  border_right: 'guitarSong.chordGrid.borderRight',
  border_bottom: 'guitarSong.chordGrid.borderBottom',
  border_left: 'guitarSong.chordGrid.borderLeft',
};

const isHorizontal = (side: BorderSide): boolean => side === 'border_top' || side === 'border_bottom';

interface SongChordGridBorderPickerProps {
  cell: Pick<ChordGridCell, BorderSide>;
  onToggle: (side: BorderSide) => void;
  children?: React.ReactNode;
}

// A square whose 4 edges are themselves the clickable border toggles, with the cell's own
// content rendered in the middle -- a live preview of the cell (borders and content together)
// rather than a border control floating apart from what it actually applies to.
export const SongChordGridBorderPicker: React.FC<SongChordGridBorderPickerProps> = ({ cell, onToggle, children }) => {
  const { theme } = useTheme();
  const { t } = useTranslation();

  const hitAreaPosition = (side: BorderSide): React.CSSProperties => {
    if (side === 'border_top') return { top: 0, left: 0, width: '100%', height: HIT_AREA_THICKNESS };
    if (side === 'border_bottom') return { bottom: 0, left: 0, width: '100%', height: HIT_AREA_THICKNESS };
    const verticalSpan = { top: HIT_AREA_THICKNESS, bottom: HIT_AREA_THICKNESS };
    return side === 'border_left'
      ? { ...verticalSpan, left: 0, width: HIT_AREA_THICKNESS }
      : { ...verticalSpan, right: 0, width: HIT_AREA_THICKNESS };
  };

  const barStyle = (side: BorderSide): React.CSSProperties => {
    const on = cell[side];
    const thickness = on ? ON_BAR_THICKNESS : OFF_BAR_THICKNESS;
    return {
      position: 'absolute',
      backgroundColor: on ? theme.colors.text : theme.colors.border,
      borderRadius: on ? '2px' : 0,
      ...(isHorizontal(side)
        ? { left: 0, right: 0, height: thickness, top: '50%', transform: 'translateY(-50%)' }
        : { top: 0, bottom: 0, width: thickness, left: '50%', transform: 'translateX(-50%)' }),
    };
  };

  return (
    <div
      style={{
        position: 'relative', minWidth: MIN_SQUARE_SIZE, minHeight: MIN_SQUARE_SIZE,
        display: 'flex', alignItems: 'center', justifyContent: 'center',
        padding: HIT_AREA_THICKNESS + 4, boxSizing: 'border-box',
        backgroundColor: theme.colors.surface, borderRadius: '4px',
      }}
    >
      {children}
      {(Object.keys(LABEL_KEYS) as BorderSide[]).map((side) => (
        <button
          key={side}
          type="button" aria-label={t(LABEL_KEYS[side])} title={t(LABEL_KEYS[side])}
          aria-pressed={cell[side]}
          onClick={() => onToggle(side)}
          style={{
            position: 'absolute', cursor: 'pointer', border: 'none', padding: 0, background: 'none',
            ...hitAreaPosition(side),
          }}
        >
          <span style={barStyle(side)} />
        </button>
      ))}
    </div>
  );
};
