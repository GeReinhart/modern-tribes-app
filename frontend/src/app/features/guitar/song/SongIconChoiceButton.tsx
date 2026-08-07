import { IconName, ThemedSvgIcon } from '@/app/platform/core/layout/themes/icons/ThemedSvgIcon.tsx';
import { useTheme } from '@/app/platform/core/layout/themes/ThemeContext.tsx';

import React from 'react';

interface SongIconChoiceButtonProps {
  icon: IconName;
  iconSize?: number;
  caption: string;
  ariaLabel: string;
  selected: boolean;
  onClick: () => void;
}

// Icon-only toggle buttons read as "all the same" the moment two choices share a glyph (or, for
// a size ramp, only differ by a few pixels) -- a short caption under the icon removes the
// ambiguity regardless of how similar the icons themselves look.
export const SongIconChoiceButton: React.FC<SongIconChoiceButtonProps> = ({
  icon, iconSize = 18, caption, ariaLabel, selected, onClick,
}) => {
  const { theme } = useTheme();

  return (
    <button
      type="button"
      onClick={onClick}
      aria-label={ariaLabel}
      title={ariaLabel}
      style={{
        display: 'flex', flexDirection: 'column', alignItems: 'center', gap: '3px',
        padding: '6px 10px', borderRadius: 'var(--radius-md)', cursor: 'pointer',
        border: `1px solid ${selected ? theme.colors.primary : theme.colors.border}`,
        backgroundColor: selected ? `${theme.colors.primary}25` : 'transparent',
      }}
    >
      <ThemedSvgIcon name={icon} color={theme.colors.text} size={iconSize} />
      <span style={{ fontSize: '10px', color: theme.colors.text, whiteSpace: 'nowrap' }}>{caption}</span>
    </button>
  );
};
