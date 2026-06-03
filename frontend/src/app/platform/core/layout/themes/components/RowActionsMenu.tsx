import { ThemedSvgIcon } from '@/app/platform/core/layout/themes/icons/ThemedSvgIcon.tsx';
import { useTheme } from '@/app/platform/core/layout/themes/ThemeContext.tsx';
import { MenuAction } from '@/app/platform/core/layout/menu.types.ts';

import React, { useCallback, useEffect, useRef, useState } from 'react';

interface RowActionsMenuProps {
  actions: MenuAction[];
}

export function RowActionsMenu({
  actions,
}: RowActionsMenuProps): React.ReactElement {
  const { theme } = useTheme();
  const [open, setOpen] = useState(false);
  const containerRef = useRef<HTMLDivElement>(null);

  const close = useCallback(() => setOpen(false), []);

  useEffect(() => {
    if (!open) return;
    const handleClickOutside = (e: MouseEvent) => {
      if (
        containerRef.current &&
        !containerRef.current.contains(e.target as Node)
      ) {
        close();
      }
    };
    document.addEventListener('mousedown', handleClickOutside);
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, [open, close]);

  const handleAction = (action: MenuAction) => {
    close();
    action.onClick();
  };

  return (
    <div
      ref={containerRef}
      style={{ position: 'relative', display: 'inline-block' }}
    >
      <button
        onClick={() => setOpen((prev) => !prev)}
        aria-label="Row actions"
        style={{
          background: 'none',
          border: 'none',
          cursor: 'pointer',
          padding: 'var(--space-xs)',
          borderRadius: 'var(--radius-sm)',
          color: theme.colors.text,
        }}
      >
        <ThemedSvgIcon
          name="more-vertical"
          color={theme.colors.text}
          size={16}
        />
      </button>
      {open && (
        <div
          style={{
            position: 'absolute',
            right: 0,
            top: '100%',
            zIndex: 50,
            background: theme.colors.surface,
            border: `1px solid ${theme.colors.border}`,
            borderRadius: 'var(--radius-md)',
            boxShadow: 'var(--shadow-md)',
            minWidth: '180px',
            padding: 'var(--space-xs) 0',
          }}
        >
          {actions.map((action) => (
            <button
              key={action.label}
              disabled={action.disabled}
              onClick={() => handleAction(action)}
              style={{
                display: 'flex',
                alignItems: 'center',
                gap: 'var(--space-sm)',
                width: '100%',
                padding: 'var(--space-sm) var(--space-md)',
                background: 'none',
                border: 'none',
                cursor: action.disabled ? 'not-allowed' : 'pointer',
                color:
                  action.variant === 'danger' ? 'theme.colors.danger' : theme.colors.text,
                opacity: action.disabled ? 0.5 : 1,
                fontSize: 'var(--font-sm)',
                textAlign: 'left',
              }}
            >
              <ThemedSvgIcon
                name={action.icon}
                color={
                  action.variant === 'danger' ? 'theme.colors.danger' : theme.colors.text
                }
                size={14}
              />
              {action.label}
            </button>
          ))}
        </div>
      )}
    </div>
  );
}
