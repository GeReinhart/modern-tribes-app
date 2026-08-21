import { IconName, ThemedSvgIcon } from '@/app/platform/core/layout/themes/icons/ThemedSvgIcon.tsx';
import { useTheme } from '@/app/platform/core/layout/themes/ThemeContext.tsx';

import React from 'react';

interface Props {
  icon: string | null;
  name: string;
  count: number;
  expanded: boolean;
  onToggle: () => void;
  actions?: React.ReactNode;
}

const GroceriesSectionToggleHeader: React.FC<Props> = ({ icon, name, count, expanded, onToggle, actions }) => {
  const { theme } = useTheme();

  return (
    <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '4px' }}>
      <button
        type="button"
        onClick={onToggle}
        style={{
          display: 'flex',
          alignItems: 'center',
          gap: '6px',
          border: 'none',
          background: 'transparent',
          cursor: 'pointer',
          padding: 0,
          fontSize: 'var(--font-xs)',
          fontWeight: 700,
          color: theme.colors.secondary,
          textTransform: 'uppercase',
        }}
      >
        <ThemedSvgIcon name={expanded ? 'chevron-down' : 'chevron-up'} color={theme.colors.secondary} size={12} />
        {icon && <ThemedSvgIcon name={icon as IconName} color={theme.colors.secondary} size={14} />}
        {name}
        <span style={{ fontWeight: 500 }}>({count})</span>
      </button>
      {actions}
    </div>
  );
};

export default GroceriesSectionToggleHeader;
