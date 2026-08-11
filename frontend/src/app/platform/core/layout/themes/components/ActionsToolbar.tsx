import { MenuAction } from '@/app/platform/core/layout/menu.types.ts';
import { RowActionsMenu } from '@/app/platform/core/layout/themes/components/RowActionsMenu.tsx';
import { ThemedIconButton } from '@/app/platform/core/layout/themes/components/ThemedIconButton.tsx';

import React from 'react';

interface ActionsToolbarProps {
  actions: MenuAction[];
  menuDirection?: 'up' | 'down';
}

// A fixed cap keeps the toolbar's height predictable without measuring layout;
// anything beyond it is still reachable through the overflow menu.
const VISIBLE_LIMIT = 10;

export const ActionsToolbar: React.FC<ActionsToolbarProps> = ({ actions, menuDirection = 'down' }) => {
  if (actions.length === 0) return null;

  const visibleActions = actions.slice(0, VISIBLE_LIMIT);
  const overflowActions = actions.slice(VISIBLE_LIMIT);

  return (
    <div style={{ display: 'flex', alignItems: 'center', gap: '2px' }}>
      {visibleActions.map((action) => (
        <ThemedIconButton key={action.label} action={action} />
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
