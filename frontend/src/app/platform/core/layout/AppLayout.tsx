import { MenuAction } from '@/app/platform/core/layout/menu.types.ts';
import { ToolbarBar } from '@/app/platform/core/layout/themes/components/ToolbarBar.tsx';
import { ToolbarConfigModal } from '@/app/platform/core/layout/themes/components/ToolbarConfigModal.tsx';
import { useAppLayoutState } from '@/app/platform/core/layout/useAppLayoutState.ts';
import { useAppLayoutStyles } from '@/app/platform/core/layout/useAppLayoutStyles.ts';

import React from 'react';

import { AppFooter } from './AppFooter.tsx';
import { AppHeader } from './AppHeader.tsx';
import { BreadcrumbItem, BreadcrumbTab, getPageTitle } from './Breadcrumb.tsx';
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
    toolbarLayout,
    configurableActions,
    placementOf,
    setPlacement,
    configureModalOpen,
    closeConfigureModal,
  } = useAppLayoutState({ menuActions, tabActions });
  const { layoutStyle, mainStyle, contentStyle } = useAppLayoutStyles(theme);
  const pageTitle = getPageTitle(breadcrumbs);

  return (
    <div style={layoutStyle}>
      {headerVisible ? (
        <AppHeader
          actions={headerActions}
          secondaryActions={secondaryActions}
          menuActions={menuActions}
          tabActions={mergedTabActions}
          breadcrumbs={breadcrumbs}
          breadcrumbTabs={breadcrumbTabs}
        />
      ) : (
        pageTitle && (
          <div
            style={{
              padding: '4px 12px',
              textAlign: 'center',
              fontSize: 'var(--font-lg)',
              fontWeight: 800,
              color: theme.colors.text,
            }}
          >
            {pageTitle}
          </div>
        )
      )}
      {toolbarPlacement === 'header' && <ToolbarBar layout={toolbarLayout} />}
      <main style={mainStyle}>
        <div style={contentStyle}>{children}</div>
      </main>
      <AppFooter
        bookmarkSlot={bookmarkSlot}
        toolbarLayout={toolbarPlacement === 'footer' ? toolbarLayout : undefined}
      />
      <ToolbarConfigModal
        isOpen={configureModalOpen}
        onClose={closeConfigureModal}
        actions={configurableActions}
        placementOf={placementOf}
        onSetPlacement={setPlacement}
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
