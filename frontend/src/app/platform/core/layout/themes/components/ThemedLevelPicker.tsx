import { IconName, ThemedSvgIcon } from '@/app/platform/core/layout/themes/icons/ThemedSvgIcon.tsx';
import { useTheme } from '@/app/platform/core/layout/themes/ThemeContext.tsx';

import React from 'react';

export interface LevelOption {
  value: number;
  icon: IconName;
  color: string;
  caption: string;
}

interface ThemedLevelPickerProps {
  options: LevelOption[];
  value: number | null;
  onChange: (value: number) => void;
  ariaLabelPrefix: string;
  disabled?: boolean;
}

// A 0..N rating widget (difficulty, mastery...) -- each level gets its own icon color and short
// caption, since a single repeated glyph with no other distinction reads as "all the same" once
// two levels share a shape.
export const ThemedLevelPicker: React.FC<ThemedLevelPickerProps> = ({
  options, value, onChange, ariaLabelPrefix, disabled = false,
}) => {
  const { theme } = useTheme();

  return (
    <div style={{ display: 'flex', flexWrap: 'wrap', gap: '6px' }}>
      {options.map((option) => {
        const selected = value === option.value;
        return (
          <button
            key={option.value}
            type="button"
            disabled={disabled}
            onClick={() => onChange(option.value)}
            aria-label={`${ariaLabelPrefix}: ${option.caption}`}
            title={option.caption}
            style={{
              display: 'flex', flexDirection: 'column', alignItems: 'center', gap: '3px',
              padding: '6px 10px', borderRadius: 'var(--radius-md)',
              cursor: disabled ? 'not-allowed' : 'pointer',
              opacity: disabled ? 0.5 : 1,
              border: `1px solid ${selected ? option.color : theme.colors.border}`,
              backgroundColor: selected ? `${option.color}25` : 'transparent',
            }}
          >
            <ThemedSvgIcon name={option.icon} color={option.color} size={18} />
            <span style={{ fontSize: '10px', color: theme.colors.text, whiteSpace: 'nowrap' }}>
              {option.caption}
            </span>
          </button>
        );
      })}
    </div>
  );
};
