import { IconName, ThemedSvgIcon } from '@/app/platform/core/layout/themes/icons/ThemedSvgIcon.tsx';
import { useTheme } from '@/app/platform/core/layout/themes/ThemeContext.tsx';

import React, { useState } from 'react';

interface ThemedPopoverProps {
  triggerIcon: IconName;
  triggerLabel: string;
  closeLabel: string;
  triggerIconSize?: number;
  direction?: 'up' | 'down';
  onOpenChange?: (open: boolean) => void;
  // A plain node, or a render function handed a `close` callback -- for content with its own
  // explicit "save and close" action (see ColumnPresentationFields/BlockPresentationFields),
  // since the panel otherwise only closes via its own trigger/close button.
  children: React.ReactNode | ((close: () => void) => React.ReactNode);
}

// A small trigger button that reveals arbitrary content (form controls, not just a list of
// actions) right next to itself — for that, use RowActionsMenu instead, which this mirrors.
// Unlike RowActionsMenu, this does NOT close on an outside click: while adjusting several
// form fields in a row, an accidental focus/click elsewhere shouldn't dismiss the panel, so
// it only closes via the trigger or the explicit close button.
export const ThemedPopover: React.FC<ThemedPopoverProps> = ({
  triggerIcon, triggerLabel, closeLabel, triggerIconSize = 14, direction = 'down', onOpenChange, children,
}) => {
  const { theme } = useTheme();
  const [open, setOpenState] = useState(false);

  const setOpen = (next: boolean) => {
    setOpenState(next);
    onOpenChange?.(next);
  };

  return (
    <div style={{ position: 'relative', display: 'inline-block' }}>
      <button
        onClick={() => setOpen(!open)}
        aria-label={triggerLabel}
        title={triggerLabel}
        style={{
          display: 'flex', alignItems: 'center', justifyContent: 'center',
          background: theme.colors.surface, border: `1px solid ${theme.colors.border}`,
          borderRadius: '50%', cursor: 'pointer', padding: '3px', boxShadow: 'var(--shadow-md)',
        }}
      >
        <ThemedSvgIcon name={triggerIcon} color={theme.colors.text} size={triggerIconSize} />
      </button>
      {open && (
        <div
          style={{
            position: 'absolute',
            left: 0,
            ...(direction === 'up' ? { bottom: '100%' } : { top: '100%' }),
            // Above the 1000 z-index a row/column/block wrapper boosts itself to while its own
            // toolbar (move/select/menu icons) is active (see SongLayoutRow/Column/
            // BlockContent) -- this popover's own trigger already lives inside that boosted
            // wrapper, so its content must clear every OTHER row/column/block's icons too, not
            // just its own. Still under ThemedModal's 2000, so a modal opened from within a
            // popover (e.g. the clipboard preview) still layers above it.
            zIndex: 1500,
            background: theme.colors.surface,
            border: `1px solid ${theme.colors.border}`,
            borderRadius: 'var(--radius-md)',
            boxShadow: 'var(--shadow-md)',
            padding: 'var(--space-sm)',
          }}
        >
          <div style={{ display: 'flex', justifyContent: 'flex-end', marginBottom: '4px' }}>
            <button
              onClick={() => setOpen(false)}
              aria-label={closeLabel}
              title={closeLabel}
              style={{ display: 'flex', background: 'none', border: 'none', cursor: 'pointer', padding: 0 }}
            >
              <ThemedSvgIcon name="x" color={theme.colors.text} size={14} />
            </button>
          </div>
          {typeof children === 'function' ? children(() => setOpen(false)) : children}
        </div>
      )}
    </div>
  );
};
