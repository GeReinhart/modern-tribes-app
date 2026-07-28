import { useTheme } from '@/app/platform/core/layout/themes/ThemeContext.tsx';
import { MenuAction } from '@/app/platform/core/layout/menu.types.ts';
import { ActionsToolbar } from '@/app/platform/core/layout/themes/components/ActionsToolbar.tsx';

import React from 'react';

interface ToolbarBarProps {
  actions: MenuAction[];
}

export const ToolbarBar: React.FC<ToolbarBarProps> = ({ actions }) => {
  const { theme } = useTheme();

  if (actions.length === 0) return null;

  const style: React.CSSProperties = {
    padding: '2px 8px',
    backgroundColor: theme.colors.surface,
    borderBottom: `1px solid ${theme.colors.primary}40`,
    display: 'flex',
    justifyContent: 'center',
  };

  return (
    <div style={style}>
      <ActionsToolbar actions={actions} />
    </div>
  );
};
