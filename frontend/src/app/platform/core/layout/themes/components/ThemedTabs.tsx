import { useTheme } from '@/app/platform/core/layout/themes/ThemeContext.tsx';

import React from 'react';
import { Link } from 'react-router-dom';

interface Tab {
  key: string;
  label: string;
  color?: string;
  href?: string;
}

interface ThemedTabsProps {
  tabs: Tab[];
  activeTab: string;
  onTabChange: (key: string) => void;
}

export const ThemedTabs: React.FC<ThemedTabsProps> = ({
  tabs,
  activeTab,
  onTabChange,
}) => {
  const { theme } = useTheme();

  return (
    <div
      style={{
        display: 'flex',
        flexWrap: 'wrap',
        alignItems: 'flex-end',
        gap: 'var(--space-xs)',
        borderBottom: `2px solid ${theme.colors.primary}30`,
        marginBottom: '0',
      }}
    >
      {tabs.map((tab) => {
        const isActive = activeTab === tab.key;
        const tabColor = tab.color ?? theme.colors.primary;
        const tabStyle: React.CSSProperties = {
          padding: 'var(--space-sm) var(--space-lg)',
          border: 'none',
          borderBottom: isActive
            ? `3px solid ${tabColor}`
            : '3px solid transparent',
          marginBottom: '-2px',
          background: isActive ? `${tabColor}15` : 'transparent',
          color: isActive ? tabColor : theme.colors.text,
          fontWeight: isActive ? 600 : 400,
          cursor: 'pointer',
          borderRadius: 'var(--radius-sm) var(--radius-sm) 0 0',
          fontSize: 'var(--font-sm)',
          transition: 'all 0.15s',
          textDecoration: 'none',
          display: 'inline-block',
        };
        if (tab.href) {
          return (
            <Link key={tab.key} to={tab.href} style={tabStyle}>
              {tab.label}
            </Link>
          );
        }
        return (
          <button key={tab.key} onClick={() => onTabChange(tab.key)} style={tabStyle}>
            {tab.label}
          </button>
        );
      })}
    </div>
  );
};
