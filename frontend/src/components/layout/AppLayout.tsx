import React from 'react';
import { useTheme } from '@/contexts/ThemeContext';
import { AppHeader } from './AppHeader';
import { BreadcrumbItem, BreadcrumbTab } from './Breadcrumb';

interface AppLayoutProps {
    children: React.ReactNode;
    headerActions?: React.ReactNode;
    secondaryActions?: React.ReactNode;
    showUserBadge?: boolean;
    breadcrumbs?: BreadcrumbItem[];
    breadcrumbTabs?: BreadcrumbTab[];
}

export const AppLayout: React.FC<AppLayoutProps> = ({
                                                         children,
                                                         headerActions,
                                                         secondaryActions,
                                                         showUserBadge = true,
                                                         breadcrumbs,
                                                         breadcrumbTabs,
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
        padding: '0 24px 24px',
        display: 'flex',
        flexDirection: 'column',
        gap: '24px',
    };

    return (
        <div style={layoutStyle}>
            <AppHeader
                actions={headerActions}
                secondaryActions={secondaryActions}
                showUserBadge={showUserBadge}
                breadcrumbs={breadcrumbs}
                breadcrumbTabs={breadcrumbTabs}
            />
            <main style={mainStyle}>{children}</main>
        </div>
    );
};
