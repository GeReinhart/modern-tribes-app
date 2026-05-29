import { useTheme } from '@/platform/core/layout/themes/ThemeContext.tsx';

import React from 'react';

interface Tab {
  key: string;
  label: string;
}

interface ThemedTabsProps {
  tabs: Tab[];
  activeTab: string;
  onTabChange: (key: string) => void;
  configButton?: React.ReactNode;
}

export const ThemedTabs: React.FC<ThemedTabsProps> = ({
  tabs,
  activeTab,
  onTabChange,
  configButton,
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
        return (
          <button
            key={tab.key}
            onClick={() => onTabChange(tab.key)}
            style={{
              padding: 'var(--space-sm) var(--space-lg)',
              border: 'none',
              borderBottom: isActive
                ? `3px solid ${theme.colors.primary}`
                : '3px solid transparent',
              marginBottom: '-2px',
              background: isActive
                ? `${theme.colors.primary}15`
                : 'transparent',
              color: isActive ? theme.colors.primary : theme.colors.text,
              fontWeight: isActive ? 600 : 400,
              cursor: 'pointer',
              borderRadius: 'var(--radius-sm) var(--radius-sm) 0 0',
              fontSize: 'var(--font-sm)',
              transition: 'all 0.15s',
            }}
          >
            {tab.label}
          </button>
        );
      })}
      {configButton && (
        <div style={{ marginLeft: 'auto', paddingBottom: 'var(--space-xs)' }}>
          {configButton}
        </div>
      )}
    </div>
  );
};
