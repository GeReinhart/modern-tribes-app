import { MenuAction } from '@/app/platform/core/layout/menu.types.ts';
import { RowActionsMenu } from '@/app/platform/core/layout/themes/components/RowActionsMenu.tsx';
import { ThemedIconButton } from '@/app/platform/core/layout/themes/components/ThemedIconButton.tsx';
import { useTheme } from '@/app/platform/core/layout/themes/ThemeContext.tsx';

import React from 'react';

interface ActionsToolbarProps {
  tabActions: MenuAction[];
  pageActions: MenuAction[];
  overflowActions: MenuAction[];
  menuDirection?: 'up' | 'down';
}

export const ActionsToolbar: React.FC<ActionsToolbarProps> = ({
  tabActions, pageActions, overflowActions, menuDirection = 'down',
}) => {
  const { theme } = useTheme();
  if (tabActions.length === 0 && pageActions.length === 0 && overflowActions.length === 0) return null;

  return (
    <div style={{ display: 'flex', alignItems: 'center', gap: '2px' }}>
      {tabActions.map((action) => (
        <ThemedIconButton key={action.id} action={action} />
      ))}
      {tabActions.length > 0 && pageActions.length > 0 && (
        <div style={{ width: '1px', alignSelf: 'stretch', margin: '0 4px', backgroundColor: theme.colors.border }} />
      )}
      {pageActions.map((action) => (
        <ThemedIconButton key={action.id} action={action} />
      ))}
      {overflowActions.length > 0 && (
        <RowActionsMenu
          actions={overflowActions}
          triggerLabel="More actions"
          triggerIconSize={24}
          direction={menuDirection}
        />
      )}
    </div>
  );
};
