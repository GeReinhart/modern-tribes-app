import { ThemedSvgIcon } from '@/app/platform/core/layout/themes/icons/ThemedSvgIcon.tsx';
import { useTheme } from '@/app/platform/core/layout/themes/ThemeContext.tsx';
import { MenuAction } from '@/app/platform/core/layout/menu.types.ts';

import React from 'react';

interface ActionIconProps {
  action: Pick<MenuAction, 'icon' | 'badgeIcon'>;
  color: string;
  size: number;
}

export const ActionIcon: React.FC<ActionIconProps> = ({ action, color, size }) => {
  const { theme } = useTheme();

  if (!action.badgeIcon) {
    return <ThemedSvgIcon name={action.icon} color={color} size={size} />;
  }

  const badgeSize = Math.round(size * 0.55);

  return (
    <span style={{ position: 'relative', display: 'inline-flex', width: size, height: size, flexShrink: 0 }}>
      <ThemedSvgIcon name={action.icon} color={color} size={size} />
      <span
        style={{
          position: 'absolute',
          right: -badgeSize * 0.3,
          bottom: -badgeSize * 0.3,
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'center',
          width: badgeSize + 2,
          height: badgeSize + 2,
          borderRadius: '50%',
          backgroundColor: theme.colors.surface,
          boxShadow: `0 0 0 1px ${theme.colors.border}`,
        }}
      >
        <ThemedSvgIcon name={action.badgeIcon} color={color} size={badgeSize - 4} />
      </span>
    </span>
  );
};
