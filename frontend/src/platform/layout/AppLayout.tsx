import { useTheme } from '@/platform/layout/themes/ThemeContext.tsx';
import { MenuAction } from '@/types/menu.types.ts';

import React from 'react';

import { AppFooter } from './AppFooter.tsx';
import { AppHeader } from './AppHeader.tsx';
import { BreadcrumbItem, BreadcrumbTab } from './Breadcrumb.tsx';

interface AppLayoutProps {
  children: React.ReactNode;
  headerActions?: React.ReactNode;
  secondaryActions?: React.ReactNode;
  menuActions?: MenuAction[];
  breadcrumbs?: BreadcrumbItem[];
  breadcrumbTabs?: BreadcrumbTab[];
  bookmarkTitle?: string | null;
}

export const AppLayout: React.FC<AppLayoutProps> = ({
  children,
  headerActions,
  secondaryActions,
  menuActions,
  breadcrumbs,
  breadcrumbTabs,
  bookmarkTitle,
}) => {
  const { theme } = useTheme();

  const layoutStyle: React.CSSProperties = {
    minHeight: '100vh',
    backgroundColor: theme.colors.surface,
    display: 'flex',
    flexDirection: 'column',
  };

  const mainStyle: React.CSSProperties = {
    flex: 1,
    display: 'flex',
    justifyContent: 'center',
    padding: 'var(--main-pad)',
  };

  const contentStyle: React.CSSProperties = {
    width: '100%',
    maxWidth: '1420px',
    display: 'flex',
    flexDirection: 'column',
    gap: '12px',
  };

  const bookmarkDescription =
    breadcrumbs && breadcrumbs.length > 0
      ? breadcrumbs.map((b) => b.label).join(' / ')
      : null;

  return (
    <div style={layoutStyle}>
      <AppHeader
        actions={headerActions}
        secondaryActions={secondaryActions}
        menuActions={menuActions}
        breadcrumbs={breadcrumbs}
        breadcrumbTabs={breadcrumbTabs}
      />
      <main style={mainStyle}>
        <div style={contentStyle}>{children}</div>
      </main>
      <AppFooter
        bookmarkTitle={bookmarkTitle}
        bookmarkDescription={bookmarkDescription}
      />
    </div>
  );
};
