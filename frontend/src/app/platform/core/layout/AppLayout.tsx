import { useTheme } from '@/app/platform/core/layout/themes/ThemeContext.tsx';
import { MenuAction } from '@/app/platform/core/layout/menu.types.ts';

import React, { useMemo } from 'react';

import { AppFooter } from './AppFooter.tsx';
import { AppHeader } from './AppHeader.tsx';
import { BreadcrumbItem, BreadcrumbTab } from './Breadcrumb.tsx';
import { HeaderVisibilityProvider, useHeaderVisibility } from './HeaderVisibilityContext.tsx';
import { useTabActionsContext } from './TabActionsContext.tsx';

interface AppLayoutProps {
  children: React.ReactNode;
  headerActions?: React.ReactNode;
  secondaryActions?: React.ReactNode;
  menuActions?: MenuAction[];
  tabActions?: MenuAction[];
  breadcrumbs?: BreadcrumbItem[];
  breadcrumbTabs?: BreadcrumbTab[];
  bookmarkSlot?: React.ReactNode;
}

const AppLayoutInner: React.FC<AppLayoutProps> = ({
  children,
  headerActions,
  secondaryActions,
  menuActions,
  tabActions,
  breadcrumbs,
  breadcrumbTabs,
  bookmarkSlot,
}) => {
  const { theme } = useTheme();
  const { tabActionsFromTab } = useTabActionsContext();
  const { headerVisible } = useHeaderVisibility();
  const mergedTabActions = useMemo(
    () => [...(tabActions ?? []), ...tabActionsFromTab],
    [tabActions, tabActionsFromTab],
  );

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

  return (
    <div style={layoutStyle}>
      {headerVisible && (
        <AppHeader
          actions={headerActions}
          secondaryActions={secondaryActions}
          menuActions={menuActions}
          tabActions={mergedTabActions}
          breadcrumbs={breadcrumbs}
          breadcrumbTabs={breadcrumbTabs}
        />
      )}
      <main style={mainStyle}>
        <div style={contentStyle}>{children}</div>
      </main>
      <AppFooter bookmarkSlot={bookmarkSlot} />
    </div>
  );
};

export const AppLayout: React.FC<AppLayoutProps> = (props) => (
  <HeaderVisibilityProvider>
    <AppLayoutInner {...props} />
  </HeaderVisibilityProvider>
);
