import { useTheme } from '@/app/platform/core/layout/themes/ThemeContext.tsx';
import { useChromeVisibility } from '@/app/platform/core/layout/ChromeVisibilityContext.tsx';
import { IconName, ThemedSvgIcon } from '@/app/platform/core/layout/themes/icons/ThemedSvgIcon.tsx';

import React from 'react';
import { Link } from 'react-router-dom';

interface Tab {
  key: string;
  label: string;
  color?: string;
  icon?: string | null;
  href?: string;
}

interface ThemedTabsProps {
  tabs: Tab[];
  activeTab: string;
  onTabChange: (key: string) => void;
  editMode?: boolean;
  hiddenTabs?: Tab[];
  onEditTab?: (key: string) => void;
}

interface DisplayTab extends Tab {
  isHidden: boolean;
}

function buildTabStyle(
  theme: ReturnType<typeof useTheme>['theme'],
  tab: DisplayTab,
  isActive: boolean,
  editMode: boolean,
): React.CSSProperties {
  const tabColor = tab.color ?? theme.colors.primary;
  const horizontalPadding = tab.label ? 'var(--space-lg)' : 'var(--space-sm)';
  const editBorderColor = tab.isHidden ? theme.colors.border : theme.colors.accent;
  return {
    padding: `var(--space-sm) ${horizontalPadding}`,
    border: editMode ? `1px dashed ${editBorderColor}` : 'none',
    borderBottom: isActive ? `3px solid ${tabColor}` : '3px solid transparent',
    marginBottom: '-2px',
    background: editMode ? `${theme.colors.accent}15` : isActive ? `${tabColor}15` : 'transparent',
    color: isActive ? tabColor : theme.colors.text,
    opacity: tab.isHidden ? 0.5 : 1,
    fontWeight: isActive ? 600 : 400,
    cursor: 'pointer',
    borderRadius: 'var(--radius-sm) var(--radius-sm) 0 0',
    fontSize: 'var(--font-sm)',
    transition: 'all 0.15s',
    textDecoration: 'none',
    display: 'inline-flex',
    alignItems: 'center',
    gap: '6px',
  };
}

const TabContent: React.FC<{ tab: Tab }> = ({ tab }) => {
  const isIconOnly = !!tab.icon && !tab.label;
  return (
    <>
      {tab.icon && <ThemedSvgIcon name={tab.icon as IconName} color="currentColor" size={isIconOnly ? 22 : 14} />}
      {tab.label && <span>{tab.label}</span>}
    </>
  );
};

export const ThemedTabs: React.FC<ThemedTabsProps> = ({
  tabs,
  activeTab,
  onTabChange,
  editMode = false,
  hiddenTabs = [],
  onEditTab,
}) => {
  const { theme } = useTheme();
  const { chromeHidden } = useChromeVisibility();

  if (chromeHidden) return null;

  const displayTabs: DisplayTab[] = [
    ...tabs.map((tab) => ({ ...tab, isHidden: false })),
    ...(editMode ? hiddenTabs.map((tab) => ({ ...tab, isHidden: true })) : []),
  ];

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
      {displayTabs.map((tab) => {
        const isActive = activeTab === tab.key;
        const tabStyle = buildTabStyle(theme, tab, isActive, editMode);
        const content = <TabContent tab={tab} />;

        if (editMode) {
          return (
            <button key={tab.key} type="button" onClick={() => onEditTab?.(tab.key)} style={tabStyle}>
              {content}
            </button>
          );
        }
        if (tab.href) {
          return (
            <Link key={tab.key} to={tab.href} style={tabStyle}>
              {content}
            </Link>
          );
        }
        return (
          <button key={tab.key} onClick={() => onTabChange(tab.key)} style={tabStyle}>
            {content}
          </button>
        );
      })}
    </div>
  );
};
