import { IconName, ThemedSvgIcon } from '@/app/platform/core/layout/themes/icons/ThemedSvgIcon.tsx';
import { ActionIcon } from '@/app/platform/core/layout/themes/components/ActionIcon.tsx';
import { useTheme } from '@/app/platform/core/layout/themes/ThemeContext.tsx';
import { MenuAction } from '@/app/platform/core/layout/menu.types.ts';

import React, { useCallback, useEffect, useRef, useState } from 'react';
import { Link } from 'react-router-dom';

interface RowActionsMenuProps {
  actions: MenuAction[];
  triggerLabel?: string;
  triggerIcon?: IconName;
  triggerIconSize?: number;
  direction?: 'up' | 'down';
  onOpenChange?: (open: boolean) => void;
}

export function RowActionsMenu({
  actions,
  triggerLabel = 'Row actions',
  triggerIcon = 'more-vertical',
  triggerIconSize = 16,
  direction = 'down',
  onOpenChange,
}: RowActionsMenuProps): React.ReactElement {
  const { theme } = useTheme();
  const [open, setOpenState] = useState(false);
  const containerRef = useRef<HTMLDivElement>(null);

  const setOpen = useCallback((next: boolean) => {
    setOpenState(next);
    onOpenChange?.(next);
  }, [onOpenChange]);

  const close = useCallback(() => setOpen(false), [setOpen]);

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
    action.onClick?.();
  };

  return (
    <div
      ref={containerRef}
      style={{ position: 'relative', display: 'inline-block' }}
    >
      <button
        onClick={() => setOpen(!open)}
        aria-label={triggerLabel}
        title={triggerLabel}
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
          name={triggerIcon}
          color={theme.colors.text}
          size={triggerIconSize}
        />
      </button>
      {open && (
        <div
          style={{
            position: 'absolute',
            right: 0,
            ...(direction === 'up' ? { bottom: '100%' } : { top: '100%' }),
            zIndex: 50,
            background: theme.colors.surface,
            border: `1px solid ${theme.colors.border}`,
            borderRadius: 'var(--radius-md)',
            boxShadow: 'var(--shadow-md)',
            minWidth: '180px',
            padding: 'var(--space-xs) 0',
          }}
        >
          {actions.map((action) => {
            const color =
              action.variant === 'danger' ? theme.colors.danger : theme.colors.text;
            const itemStyle: React.CSSProperties = {
              display: 'flex',
              alignItems: 'center',
              gap: 'var(--space-sm)',
              width: '100%',
              padding: 'var(--space-sm) var(--space-md)',
              background: 'none',
              border: 'none',
              cursor: action.disabled ? 'not-allowed' : 'pointer',
              color,
              opacity: action.disabled ? 0.5 : 1,
              fontSize: 'var(--font-sm)',
              textAlign: 'left',
            };
            if (action.path && !action.disabled) {
              return (
                <Link
                  key={action.label}
                  to={action.path}
                  style={{ ...itemStyle, textDecoration: 'none' }}
                  onClick={close}
                >
                  <ActionIcon action={action} color={color} size={14} />
                  {action.label}
                </Link>
              );
            }
            return (
              <button
                key={action.label}
                disabled={action.disabled}
                onClick={() => handleAction(action)}
                style={itemStyle}
              >
                <ActionIcon action={action} color={color} size={14} />
                {action.label}
              </button>
            );
          })}
        </div>
      )}
    </div>
  );
}
