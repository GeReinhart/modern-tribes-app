import {
  IconName,
  ThemedSvgIcon,
} from '@/platform/layout/themes/icons/ThemedSvgIcon.tsx';
import { useTheme } from '@/platform/layout/themes/ThemeContext.tsx';

import React from 'react';
import { useTranslation } from 'react-i18next';
import { useNavigate } from 'react-router-dom';

type AdminPage =
  | 'authorization'
  | 'tribes'
  | 'documents'
  | 'monitoring'
  | 'mails'
  | 'people'
  | 'config'
  | 'features'
  | 'publications'
  | 'notifications';

interface AdminNavigationProps {
  currentPage: AdminPage;
}

export const adminMainThemeId: string = 'alt_05';

const items: Array<{
  page: AdminPage | 'app';
  icon: IconName;
  labelKey: string;
  path: string;
}> = [
  { page: 'app', icon: 'arrow-left', labelKey: 'admin.app', path: '/app' },
  {
    page: 'monitoring',
    icon: 'eye',
    labelKey: 'admin.monitoring',
    path: '/admin/monitoring',
  },
  {
    page: 'mails',
    icon: 'archive',
    labelKey: 'admin.mails.nav',
    path: '/admin/mails',
  },
  {
    page: 'people',
    icon: 'user',
    labelKey: 'admin.people',
    path: '/admin/people',
  },
  {
    page: 'authorization',
    icon: 'hash',
    labelKey: 'admin.authorization',
    path: '/admin/authorization',
  },
  {
    page: 'tribes',
    icon: 'external-link',
    labelKey: 'admin.tribes',
    path: '/admin/tribes',
  },
  {
    page: 'documents',
    icon: 'file-text',
    labelKey: 'admin.documents',
    path: '/admin/documents',
  },
  {
    page: 'config',
    icon: 'settings',
    labelKey: 'admin.config',
    path: '/admin/config',
  },
  {
    page: 'features',
    icon: 'plus',
    labelKey: 'admin.features',
    path: '/admin/features',
  },
  {
    page: 'publications',
    icon: 'upload',
    labelKey: 'publications.title',
    path: '/admin/publications',
  },
  {
    page: 'notifications',
    icon: 'bell',
    labelKey: 'admin.notifications',
    path: '/admin/notifications',
  },
];

export const AdminNavigation: React.FC<AdminNavigationProps> = ({
  currentPage,
}) => {
  const navigate = useNavigate();
  const { t } = useTranslation();
  const { theme } = useTheme();

  return (
    <div style={{ display: 'grid', gridTemplateColumns: 'repeat(2, 1fr)' }}>
      {items.map(({ page, icon, labelKey, path }) => {
        const isActive = page === currentPage;
        const color = isActive ? theme.colors.primary : theme.colors.text;
        return (
          <div
            key={page}
            role="menuitem"
            style={{
              padding: '12px 24px',
              cursor: 'pointer',
              color,
              fontSize: 'calc(var(--btn-font) * 1.2)',
              fontWeight: isActive ? 700 : 600,
              borderLeft: isActive
                ? `3px solid ${theme.colors.primary}`
                : '3px solid transparent',
              transition: 'background-color 0.15s ease',
              display: 'flex',
              alignItems: 'center',
              gap: '10px',
            }}
            onClick={() => navigate(path)}
            onMouseEnter={(e) => {
              if (!isActive)
                e.currentTarget.style.backgroundColor = `${theme.colors.primary}10`;
            }}
            onMouseLeave={(e) => {
              if (!isActive)
                e.currentTarget.style.backgroundColor = 'transparent';
            }}
          >
            <ThemedSvgIcon name={icon} color={color} size={16} />
            {t(labelKey)}
          </div>
        );
      })}
    </div>
  );
};
