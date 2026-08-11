import { MenuAction } from '@/app/platform/core/layout/menu.types.ts';
import { ToolbarBar } from '@/app/platform/core/layout/themes/components/ToolbarBar.tsx';
import { useAppLayoutState } from '@/app/platform/core/layout/useAppLayoutState.ts';
import { useAppLayoutStyles } from '@/app/platform/core/layout/useAppLayoutStyles.ts';

import React from 'react';

import { AppFooter } from './AppFooter.tsx';
import { AppHeader } from './AppHeader.tsx';
import { BreadcrumbItem, BreadcrumbTab } from './Breadcrumb.tsx';
import { ChromeVisibilityProvider } from './ChromeVisibilityContext.tsx';
import { ToolbarPlacementProvider } from './ToolbarPlacementContext.tsx';

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
  const {
    theme,
    headerVisible,
    toolbarPlacement,
    mergedTabActions,
    toolbarActions,
  } = useAppLayoutState({ menuActions, tabActions });
  const { layoutStyle, mainStyle, contentStyle } = useAppLayoutStyles(theme);

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
      {toolbarPlacement === 'header' && <ToolbarBar actions={toolbarActions} />}
      <main style={mainStyle}>
        <div style={contentStyle}>{children}</div>
      </main>
      <AppFooter
        bookmarkSlot={bookmarkSlot}
        toolbarActions={toolbarPlacement === 'footer' ? toolbarActions : undefined}
      />
    </div>
  );
};

export const AppLayout: React.FC<AppLayoutProps> = (props) => (
  <ToolbarPlacementProvider>
    <ChromeVisibilityProvider>
      <AppLayoutInner {...props} />
    </ChromeVisibilityProvider>
  </ToolbarPlacementProvider>
);
