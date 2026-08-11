import {
  IconName,
  ThemedSvgIcon,
} from '@/app/platform/core/layout/themes/icons/ThemedSvgIcon.tsx';
import { ActionsToolbar } from '@/app/platform/core/layout/themes/components/ActionsToolbar.tsx';
import { ThemedIconButton } from '@/app/platform/core/layout/themes/components/ThemedIconButton.tsx';
import { ZoomControl } from '@/app/platform/core/layout/themes/components/ZoomControl.tsx';
import { UserAvatarIcon } from '@/app/platform/functions/people/users/UserAvatarIcon.tsx';
import { useTheme } from '@/app/platform/core/layout/themes/ThemeContext.tsx';
import { useChromeVisibility } from '@/app/platform/core/layout/ChromeVisibilityContext.tsx';
import { MenuAction } from '@/app/platform/core/layout/menu.types.ts';

import React from 'react';
import { useLocation, useNavigate } from 'react-router-dom';

interface AppFooterProps {
  bookmarkSlot?: React.ReactNode;
  toolbarActions?: MenuAction[];
}

const NAV_ITEMS: { path: string; icon: IconName; label: string }[] = [
  { path: '/app/search', icon: 'search', label: 'Search' },
  { path: '/app/about', icon: 'info', label: 'About' },
];

interface FooterIconToggleProps {
  icon: IconName;
  label: string;
  color: string;
  onClick: () => void;
}

const FooterIconToggle: React.FC<FooterIconToggleProps> = ({ icon, label, color, onClick }) => (
  <div
    style={{ cursor: 'pointer', display: 'flex', alignItems: 'center', opacity: 0.7 }}
    onClick={onClick}
    role="button"
    aria-label={label}
    title={label}
  >
    <ThemedSvgIcon name={icon} color={color} size={20} />
  </div>
);

export const AppFooter: React.FC<AppFooterProps> = ({ bookmarkSlot, toolbarActions }) => {
  const { theme } = useTheme();
  const location = useLocation();
  const navigate = useNavigate();
  const { chromeHidden, toggleChromeHidden } = useChromeVisibility();

  const chromeToggleAction: MenuAction = {
    icon: chromeHidden ? 'eye' : 'eye-off',
    label: chromeHidden ? 'Show header, toolbar and footer' : 'Hide header, toolbar and footer',
    onClick: toggleChromeHidden,
  };

  const collapsedFooterStyle: React.CSSProperties = {
    position: 'sticky',
    bottom: 0,
    zIndex: 10,
    alignSelf: 'flex-end',
    width: 'fit-content',
    padding: '4px 8px',
    backgroundColor: theme.colors.surface,
    borderTop: `1px solid ${theme.colors.primary}40`,
    borderLeft: `1px solid ${theme.colors.primary}40`,
    boxShadow: '0 -2px 8px rgba(0,0,0,0.10)',
  };

  if (chromeHidden) {
    return (
      <footer style={collapsedFooterStyle}>
        <ThemedIconButton action={chromeToggleAction} />
      </footer>
    );
  }

  const footerStyle: React.CSSProperties = {
    position: 'sticky',
    bottom: 0,
    zIndex: 10,
    padding: '4px 16px',
    backgroundColor: theme.colors.surface,
    borderTop: `1px solid ${theme.colors.primary}40`,
    boxShadow: '0 -2px 8px rgba(0,0,0,0.10)',
    display: 'flex',
    flexDirection: 'column',
  };

  const navRowStyle: React.CSSProperties = {
    display: 'flex',
    alignItems: 'center',
    justifyContent: 'space-between',
  };

  const toolbarRowStyle: React.CSSProperties = {
    display: 'flex',
    justifyContent: 'center',
    borderBottom: `1px solid ${theme.colors.border}`,
    marginBottom: '2px',
    paddingBottom: '2px',
  };

  const navStyle: React.CSSProperties = {
    display: 'flex',
    alignItems: 'center',
    gap: 'var(--space-md)',
  };

  const navIconStyle = (active: boolean): React.CSSProperties => ({
    cursor: 'pointer',
    opacity: active ? 1 : 0.55,
    display: 'flex',
    alignItems: 'center',
  });

  return (
    <footer style={footerStyle}>
      {toolbarActions && toolbarActions.length > 0 && (
        <div style={toolbarRowStyle}>
          <ActionsToolbar actions={toolbarActions} menuDirection="up" />
        </div>
      )}
      <div style={navRowStyle}>
        <div style={navStyle}>
          <UserAvatarIcon size={28} />
          {NAV_ITEMS.map(({ path, icon, label }) => {
            const isActive = location.pathname === path;
            return (
              <div
                key={path}
                style={navIconStyle(isActive)}
                onClick={() => navigate(path)}
                role="button"
                aria-label={label}
                title={label}
              >
                <ThemedSvgIcon
                  name={icon}
                  color={isActive ? theme.colors.primary : theme.colors.text}
                  size={20}
                />
              </div>
            );
          })}
          {bookmarkSlot}
        </div>
        <div style={{ display: 'flex', alignItems: 'center', gap: 'var(--space-md)' }}>
          <ZoomControl />
          <FooterIconToggle
            icon={chromeToggleAction.icon}
            label={chromeToggleAction.label}
            color={theme.colors.text}
            onClick={toggleChromeHidden}
          />
        </div>
      </div>
    </footer>
  );
};
