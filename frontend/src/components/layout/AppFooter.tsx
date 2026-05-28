import {
  IconName,
  ThemedSvgIcon,
} from '@/components/common/icons/ThemedSvgIcon';
import { ZoomControl } from '@/components/common/layout/ZoomControl';
import { UserAvatarIcon } from '@/components/entities/users/UserAvatarIcon';
import { useTheme } from '@/contexts/ThemeContext';
import { BookmarkToggle } from '@/features/bookmarks/BookmarkToggle';

import React from 'react';
import { useLocation, useNavigate } from 'react-router-dom';

interface AppFooterProps {
  bookmarkTitle?: string | null;
  bookmarkDescription?: string | null;
}

const NAV_ITEMS: { path: string; icon: IconName; label: string }[] = [
  { path: '/app/search', icon: 'search', label: 'Search' },
  { path: '/app/about', icon: 'info', label: 'About' },
];

export const AppFooter: React.FC<AppFooterProps> = ({
  bookmarkTitle,
  bookmarkDescription,
}) => {
  const { theme } = useTheme();
  const location = useLocation();
  const navigate = useNavigate();

  const footerStyle: React.CSSProperties = {

    position: 'sticky',
    bottom: 0,
    zIndex: 10,
    padding: '4px 16px',
    backgroundColor: theme.colors.surface,
    borderTop: `1px solid ${theme.colors.primary}40`,
    boxShadow: '0 -2px 8px rgba(0,0,0,0.10)',
    display: 'flex',
    alignItems: 'center',
    justifyContent: 'space-between',
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
        {bookmarkTitle && (
          <BookmarkToggle
            pagePath={location.pathname}
            pageTitle={bookmarkTitle}
            pageDescription={bookmarkDescription ?? null}
          />
        )}
      </div>
      <ZoomControl />
    </footer>
  );
};
