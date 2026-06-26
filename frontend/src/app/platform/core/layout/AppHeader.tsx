import { ApplicationLogo } from '@/app/platform/core/layout/themes/icons/ApplicationLogo.tsx';
import { ThemedSvgIcon } from '@/app/platform/core/layout/themes/icons/ThemedSvgIcon.tsx';
import { useTheme } from '@/app/platform/core/layout/themes/ThemeContext.tsx';
import { MenuAction } from '@/app/platform/core/layout/menu.types.ts';

import React, { useEffect, useRef, useState } from 'react';
import { Link } from 'react-router-dom';

import { BreadcrumbItem, BreadcrumbTab } from './Breadcrumb.tsx';
import {predefinedThemes} from "@/app/platform/core/layout/themes/themes.ts";

interface AppHeaderProps {
  actions?: React.ReactNode;
  secondaryActions?: React.ReactNode;
  menuActions?: MenuAction[];
  tabActions?: MenuAction[];
  breadcrumbs?: BreadcrumbItem[];
  breadcrumbTabs?: BreadcrumbTab[];
}

const AREA_COLORS = {
  breadcrumbs: predefinedThemes.default.colors.surface,
  tabs: predefinedThemes.main_1.colors.surface,
  tabActiveBorder: predefinedThemes.main_3.colors.primary,
  pageActions: predefinedThemes.main_2.colors.surface,
  tabActions: predefinedThemes.main_3.colors.surface,
};

export const AppHeader: React.FC<AppHeaderProps> = ({
  actions,
  secondaryActions,
  menuActions,
  tabActions,
  breadcrumbs,
  breadcrumbTabs,
}) => {
  const { theme, currentThemeKey } = useTheme();
  const [isMenuOpen, setIsMenuOpen] = useState(false);
  const menuRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    if (!isMenuOpen) return;
    const onMouseDown = (e: MouseEvent) => {
      if (menuRef.current && !menuRef.current.contains(e.target as Node)) {
        setIsMenuOpen(false);
      }
    };
    const onKeyDown = (e: KeyboardEvent) => {
      if (e.key === 'Escape') setIsMenuOpen(false);
    };
    document.addEventListener('mousedown', onMouseDown);
    document.addEventListener('keydown', onKeyDown);
    return () => {
      document.removeEventListener('mousedown', onMouseDown);
      document.removeEventListener('keydown', onKeyDown);
    };
  }, [isMenuOpen]);

  const TAB_COLUMN_LIMIT = 5;
  const tabsCol1 = breadcrumbTabs?.slice(0, TAB_COLUMN_LIMIT) ?? [];
  const tabsCol2 = breadcrumbTabs?.slice(TAB_COLUMN_LIMIT) ?? [];
  const hasExtraTabs = tabsCol2.length > 0;

  const headerStyle: React.CSSProperties = {
    position: 'sticky',
    top: 0,
    zIndex: 100,
    backgroundColor: theme.colors.surface,
    borderBottom: `1px solid ${theme.colors.primary}40`,
    boxShadow: '0 2px 8px rgba(0,0,0,0.10)',
    marginBottom: 'var(--space-lg)',
  };

  const headerInnerStyle: React.CSSProperties = {
    maxWidth: '1420px',
    width: '100%',
    margin: '0 auto',
    padding: 'var(--header-pad)',
    display: 'flex',
    justifyContent: 'space-between',
    alignItems: 'center',
    gap: 'var(--space-lg)',
  };

  const menuStyle: React.CSSProperties = {
    position: 'absolute',
    top: '100%',
    left: 0,
    zIndex: 1000,
    backgroundColor: theme.colors.surface,
    border: `2px solid ${theme.colors.border}`,
    borderRadius: '12px',
    boxShadow: '0 8px 24px rgba(0,0,0,0.15)',
    minWidth: hasExtraTabs ? '540px' : breadcrumbTabs ? '360px' : '330px',
    maxWidth: 'calc(100vw - 16px)',
    marginTop: '12px',
    overflow: 'hidden',
    boxSizing: 'border-box',
  };

  const menuNavItemStyle = (
    clickable: boolean,
    isLast: boolean,
    activeBorderColor?: string,
  ): React.CSSProperties => ({
    padding: '12px 24px',
    cursor: clickable ? 'pointer' : 'default',
    color: isLast ? theme.colors.primary : theme.colors.text,
    fontSize: 'var(--btn-font)',
    fontWeight: isLast ? 700 : 600,
    borderLeft: isLast
      ? `3px solid ${activeBorderColor ?? theme.colors.primary}`
      : '3px solid transparent',
    transition: 'background-color 0.15s ease',
  });

  const menuSeparatorStyle: React.CSSProperties = {
    height: '1px',
    backgroundColor: theme.colors.border,
    margin: '6px 0',
  };

  const hasPageActions = (menuActions?.length ?? 0) > 0;
  const hasTabActions = (tabActions?.length ?? 0) > 0;
  const hasActionsRow = hasPageActions || hasTabActions;

  const renderActionItem = (action: MenuAction, index: number) => {
    const color = action.variant === 'danger' ? theme.colors.danger : theme.colors.text;
    const itemStyle: React.CSSProperties = {
      padding: '12px 24px', display: 'flex', alignItems: 'center', gap: '10px',
      color, fontSize: 'var(--btn-font)', fontWeight: 600,
      opacity: action.disabled ? 0.5 : 1,
      cursor: action.disabled ? 'not-allowed' : 'pointer',
      transition: 'background-color 0.15s ease',
    };
    const onHover = (e: React.MouseEvent<HTMLElement>, on: boolean) => {
      if (!action.disabled)
        e.currentTarget.style.backgroundColor = on ? `${theme.colors.primary}10` : 'transparent';
    };
    if (action.path && !action.disabled) {
      return (
        <Link key={index} to={action.path} role="menuitem"
          style={{ ...itemStyle, textDecoration: 'none' }}
          onClick={() => setIsMenuOpen(false)}
          onMouseEnter={(e) => onHover(e, true)} onMouseLeave={(e) => onHover(e, false)}
        >
          <ThemedSvgIcon name={action.icon} color={color} size={16} />{action.label}
        </Link>
      );
    }
    return (
      <div key={index} role="menuitem" style={itemStyle}
        onClick={() => { if (!action.disabled) { action.onClick?.(); setIsMenuOpen(false); } }}
        onMouseEnter={(e) => onHover(e, true)} onMouseLeave={(e) => onHover(e, false)}
      >
        <ThemedSvgIcon name={action.icon} color={color} size={16} />{action.label}
      </div>
    );
  };

  const menuSecondaryActionsStyle: React.CSSProperties = {
    display: 'grid',
    gridTemplateColumns: 'repeat(2, 1fr)',
    gap: '6px',
    padding: '12px 24px',
  };

  const hasMenuContent = true;
  const pageTitle =
    breadcrumbs && breadcrumbs.length > 0
      ? breadcrumbs[breadcrumbs.length - 1].label
      : undefined;

  return (
    <header style={headerStyle}>
      <div style={headerInnerStyle}>
        {/* Left - Logo (menu trigger) */}
        <div ref={menuRef} style={{ position: 'relative', flexShrink: 0 }}>
          <div
            className="header-logo"
            style={{ cursor: hasMenuContent ? 'pointer' : 'default' }}
            onClick={() => hasMenuContent && setIsMenuOpen((prev) => !prev)}
            aria-haspopup={hasMenuContent ? 'menu' : undefined}
            aria-expanded={isMenuOpen}
          >
            <ApplicationLogo size="sm" themeId={currentThemeKey} />
          </div>

          {isMenuOpen && hasMenuContent && (
            <div style={menuStyle} role="menu">
              {/* Row 1: breadcrumbs (left) | tabs (right) */}
              {breadcrumbs && breadcrumbs.length > 0 && (
                <div
                  style={{
                    display: 'grid',
                    gridTemplateColumns: hasExtraTabs ? '1fr 1fr 1fr' : breadcrumbTabs ? '1fr 1fr' : '1fr',
                    borderBottom:
                      secondaryActions || actions || hasActionsRow
                        ? `1px solid ${theme.colors.border}`
                        : undefined,
                  }}
                >
                  <div style={{ backgroundColor: AREA_COLORS.breadcrumbs }}>
                    {breadcrumbs.map((item, index) => {
                      const isLast = index === breadcrumbs.length - 1;
                      const clickable = !isLast && !!item.path;
                      const navStyle = { ...menuNavItemStyle(clickable, isLast), display: 'block', textDecoration: 'none' };
                      if (clickable && item.path) {
                        return (
                          <Link
                            key={index}
                            to={item.path}
                            role="menuitem"
                            style={navStyle}
                            onClick={() => setIsMenuOpen(false)}
                            onMouseEnter={(e) => {
                              e.currentTarget.style.backgroundColor = `${theme.colors.primary}10`;
                            }}
                            onMouseLeave={(e) => {
                              e.currentTarget.style.backgroundColor = 'transparent';
                            }}
                          >
                            {item.label}
                          </Link>
                        );
                      }
                      return (
                        <div key={index} role="menuitem" style={navStyle}>
                          {item.label}
                        </div>
                      );
                    })}
                  </div>
                  {breadcrumbTabs && (
                    <div
                      style={{
                        borderLeft: `1px solid ${theme.colors.border}`,
                        backgroundColor: AREA_COLORS.tabs,
                      }}
                    >
                      {tabsCol1.map((tab) => (
                        <Link
                          key={tab.key}
                          to={tab.path}
                          role="menuitem"
                          style={{ ...menuNavItemStyle(true, tab.isActive, AREA_COLORS.tabActiveBorder), display: 'block', textDecoration: 'none' }}
                          onClick={() => setIsMenuOpen(false)}
                          onMouseEnter={(e) => {
                            if (!tab.isActive)
                              e.currentTarget.style.backgroundColor = `${theme.colors.primary}10`;
                          }}
                          onMouseLeave={(e) => {
                            if (!tab.isActive)
                              e.currentTarget.style.backgroundColor = 'transparent';
                          }}
                        >
                          {tab.label}
                        </Link>
                      ))}
                    </div>
                  )}
                  {hasExtraTabs && (
                    <div
                      style={{
                        borderLeft: `1px solid ${theme.colors.border}`,
                        backgroundColor: AREA_COLORS.tabs,
                      }}
                    >
                      {tabsCol2.map((tab) => (
                        <Link
                          key={tab.key}
                          to={tab.path}
                          role="menuitem"
                          style={{ ...menuNavItemStyle(true, tab.isActive, AREA_COLORS.tabActiveBorder), display: 'block', textDecoration: 'none' }}
                          onClick={() => setIsMenuOpen(false)}
                          onMouseEnter={(e) => {
                            if (!tab.isActive)
                              e.currentTarget.style.backgroundColor = `${theme.colors.primary}10`;
                          }}
                          onMouseLeave={(e) => {
                            if (!tab.isActive)
                              e.currentTarget.style.backgroundColor = 'transparent';
                          }}
                        >
                          {tab.label}
                        </Link>
                      ))}
                    </div>
                  )}
                </div>
              )}

              {/* Current page actions */}
              {secondaryActions && (
                <div
                  style={menuSecondaryActionsStyle}
                  onClick={() => setIsMenuOpen(false)}
                >
                  {secondaryActions}
                </div>
              )}

              {/* Separator between current page actions and admin nav */}
              {secondaryActions && actions && (
                <div style={menuSeparatorStyle} />
              )}

              {/* Admin navigation */}
              {actions && (
                <div onClick={() => setIsMenuOpen(false)}>
                  {actions}
                </div>
              )}

              {/* Row 2: page actions (left) | tab actions (right) */}
              {hasActionsRow && (
                <div
                  style={{
                    display: 'grid',
                    gridTemplateColumns: '1fr 1fr',
                  }}
                >
                  <div style={{ backgroundColor: AREA_COLORS.pageActions }}>
                    {menuActions?.map(renderActionItem)}
                  </div>
                  <div
                    style={{
                      backgroundColor: AREA_COLORS.tabActions,
                      borderLeft: `1px solid ${theme.colors.border}`,
                    }}
                  >
                    {tabActions?.map(renderActionItem)}
                  </div>
                </div>
              )}
            </div>
          )}
        </div>

        {/* Centre - Page title */}
        {pageTitle && (
          <div style={{ flex: 1, minWidth: 0 }}>
            <span
              style={{
                color: theme.colors.text,
                fontSize: 'var(--font-xl)',
                fontWeight: 800,
                display: 'block',
                wordBreak: 'break-word',
              }}
            >
              {pageTitle}
            </span>
          </div>
        )}
      </div>
    </header>
  );
};
