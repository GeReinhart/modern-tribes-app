import { IconName, ThemedSvgIcon } from '@/app/platform/core/layout/themes/icons/ThemedSvgIcon.tsx';
import { useTheme } from '@/app/platform/core/layout/themes/ThemeContext.tsx';

import React from 'react';

interface IconGridButtonProps {
  icon: IconName;
  selected: boolean;
  onClick: () => void;
}

export const IconGridButton: React.FC<IconGridButtonProps> = ({ icon, selected, onClick }) => {
  const { theme } = useTheme();

  return (
    <button
      type="button"
      onClick={onClick}
      title={icon}
      aria-label={icon}
      style={{
        width: '32px',
        height: '32px',
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'center',
        border: `1px solid ${selected ? theme.colors.primary : theme.colors.border}`,
        borderRadius: '8px',
        backgroundColor: selected ? `${theme.colors.primary}20` : 'transparent',
        cursor: 'pointer',
        flexShrink: 0,
      }}
    >
      <ThemedSvgIcon name={icon} color={theme.colors.text} size={16} />
    </button>
  );
};
