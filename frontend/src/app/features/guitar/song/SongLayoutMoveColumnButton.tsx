import { IconName, ThemedSvgIcon } from '@/app/platform/core/layout/themes/icons/ThemedSvgIcon.tsx';
import { useTheme } from '@/app/platform/core/layout/themes/ThemeContext.tsx';

import React from 'react';

interface SongLayoutMoveColumnButtonProps {
  icon: IconName;
  label: string;
  onClick: () => void;
  disabled: boolean;
}

// Sized and styled to match the small circular trigger button ThemedPopover renders (used by
// the column's own menu icon right next to this one), so the two sit flush at the same size.
export const SongLayoutMoveColumnButton: React.FC<SongLayoutMoveColumnButtonProps> = ({ icon, label, onClick, disabled }) => {
  const { theme } = useTheme();

  return (
    <button
      type="button"
      onClick={onClick}
      disabled={disabled}
      aria-label={label}
      title={label}
      style={{
        display: 'flex', alignItems: 'center', justifyContent: 'center',
        background: theme.colors.surface, border: `1px solid ${theme.colors.border}`,
        borderRadius: '50%', cursor: disabled ? 'not-allowed' : 'pointer', padding: '3px',
        boxShadow: 'var(--shadow-md)', opacity: disabled ? 0.4 : 1,
      }}
    >
      <ThemedSvgIcon name={icon} color={theme.colors.text} size={12} />
    </button>
  );
};
