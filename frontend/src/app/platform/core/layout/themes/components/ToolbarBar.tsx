import { useTheme } from '@/app/platform/core/layout/themes/ThemeContext.tsx';
import { ToolbarLayout } from '@/app/platform/core/layout/toolbarLayout.ts';
import { useChromeVisibility } from '@/app/platform/core/layout/ChromeVisibilityContext.tsx';
import { ActionsToolbar } from '@/app/platform/core/layout/themes/components/ActionsToolbar.tsx';

import React from 'react';

interface ToolbarBarProps {
  layout: ToolbarLayout;
}

export const ToolbarBar: React.FC<ToolbarBarProps> = ({ layout }) => {
  const { theme } = useTheme();
  const { chromeHidden } = useChromeVisibility();
  const { directTabActions, directPageActions, overflowActions } = layout;
  const isEmpty = directTabActions.length === 0 && directPageActions.length === 0 && overflowActions.length === 0;

  if (isEmpty || chromeHidden) return null;

  const style: React.CSSProperties = {
    padding: '2px 8px',
    backgroundColor: theme.colors.surface,
    borderBottom: `1px solid ${theme.colors.primary}40`,
    display: 'flex',
    justifyContent: 'center',
  };

  return (
    <div style={style}>
      <ActionsToolbar
        tabActions={directTabActions}
        pageActions={directPageActions}
        overflowActions={overflowActions}
      />
    </div>
  );
};
