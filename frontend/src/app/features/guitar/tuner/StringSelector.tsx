import { useTheme } from '@/app/platform/core/layout/themes/ThemeContext.tsx';
import React from 'react';
import { GUITAR_STRINGS } from './guitarStrings.ts';

interface Props {
  activeString: number | null;
  detectedString: number | null;
  onSelect: (s: number | null) => void;
}

const StringSelector: React.FC<Props> = ({ activeString, detectedString, onSelect }) => {
  const { theme } = useTheme();

  return (
    <div style={{ display: 'flex', gap: '8px', alignItems: 'flex-end' }}>
      {GUITAR_STRINGS.map(s => {
        const isActive = activeString === s.string;
        const isDetected = detectedString === s.string && activeString === null;
        const highlighted = isActive || isDetected;
        return (
          <button
            key={s.string}
            type="button"
            onClick={() => onSelect(activeString === s.string ? null : s.string)}
            title={s.label}
            style={{
              padding: '6px 10px',
              border: `2px solid ${highlighted ? theme.colors.primary : theme.colors.ghost}`,
              borderRadius: '8px',
              backgroundColor: isActive ? theme.colors.primary : 'transparent',
              color: isActive ? theme.colors.surface : highlighted ? theme.colors.primary : theme.colors.text,
              cursor: 'pointer',
              fontSize: '16px',
              fontWeight: highlighted ? '600' : '400',
            }}
          >
            {s.label === 'High E' ? 'e' : s.note}
          </button>
        );
      })}
    </div>
  );
};

export default StringSelector;
