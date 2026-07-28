import { ActionIcon } from '@/app/platform/core/layout/themes/components/ActionIcon.tsx';
import { useTheme } from '@/app/platform/core/layout/themes/ThemeContext.tsx';
import { MenuAction } from '@/app/platform/core/layout/menu.types.ts';

import React from 'react';
import { Link } from 'react-router-dom';

interface ThemedIconButtonProps {
  action: MenuAction;
  onActivate?: () => void;
}

export const ThemedIconButton: React.FC<ThemedIconButtonProps> = ({ action, onActivate }) => {
  const { theme } = useTheme();
  const color = action.variant === 'danger' ? theme.colors.danger : theme.colors.text;

  const buttonStyle: React.CSSProperties = {
    display: 'flex',
    alignItems: 'center',
    justifyContent: 'center',
    width: '38px',
    height: '38px',
    borderRadius: 'var(--radius-md)',
    color,
    opacity: action.disabled ? 0.4 : 1,
    cursor: action.disabled ? 'not-allowed' : 'pointer',
    textDecoration: 'none',
    background: 'none',
    border: `1px solid ${color}40`,
    flexShrink: 0,
  };

  const onHover = (e: React.MouseEvent<HTMLElement>, on: boolean) => {
    if (!action.disabled) {
      e.currentTarget.style.backgroundColor = on ? `${theme.colors.primary}15` : 'transparent';
    }
  };

  if (action.path && !action.disabled) {
    return (
      <Link
        to={action.path}
        style={buttonStyle}
        title={action.label}
        aria-label={action.label}
        onClick={onActivate}
        onMouseEnter={(e) => onHover(e, true)}
        onMouseLeave={(e) => onHover(e, false)}
      >
        <ActionIcon action={action} color={color} size={22} />
      </Link>
    );
  }

  return (
    <button
      type="button"
      style={buttonStyle}
      title={action.label}
      aria-label={action.label}
      disabled={action.disabled}
      onClick={() => {
        action.onClick?.();
        onActivate?.();
      }}
      onMouseEnter={(e) => onHover(e, true)}
      onMouseLeave={(e) => onHover(e, false)}
    >
      <ActionIcon action={action} color={color} size={22} />
    </button>
  );
};
