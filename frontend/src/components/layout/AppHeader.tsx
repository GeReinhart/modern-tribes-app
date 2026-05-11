
import React from 'react';
import { useTheme } from '@/contexts/ThemeContext';
import { ApplicationLogo } from '@/components/common/icons/ApplicationLogo';
import { useNavigate } from 'react-router-dom';
import { Breadcrumb, BreadcrumbItem } from './Breadcrumb';
import UserBadge from "@/components/entities/users/CurrentUserBadge.tsx";



interface AppHeaderProps {
    actions?: React.ReactNode;
    secondaryActions?: React.ReactNode;
    showUserBadge?: boolean;
    breadcrumbs?: BreadcrumbItem[];
}

export const AppHeader: React.FC<AppHeaderProps> = ({
                                                        actions,
                                                        secondaryActions,
                                                        showUserBadge = true,
                                                        breadcrumbs
                                                    }) => {
    const { theme } = useTheme();
    const navigate = useNavigate();

    const headerStyle: React.CSSProperties = {
        display: 'flex',
        justifyContent: 'space-between',
        alignItems: 'center',
        padding: '16px 24px',
        backgroundColor: theme.colors.surface,
        borderBottom: `2px solid ${theme.colors.border}`,
        marginBottom: '24px',
        gap: '24px',
    };

    const logoContainerStyle: React.CSSProperties = {
        cursor: 'pointer',
        flexShrink: 0,
    };

    const middleSectionStyle: React.CSSProperties = {
        display: 'flex',
        flexDirection: 'column',
        gap: '8px',
        flex: 1,
        minWidth: 0,
    };

    const breadcrumbContainerStyle: React.CSSProperties = {
        display: 'flex',
        alignItems: 'center',
    };

    const actionsContainerStyle: React.CSSProperties = {
        display: 'flex',
        alignItems: 'center',
        gap: '12px',
        flexWrap: 'wrap',
    };

    const rightSectionStyle: React.CSSProperties = {
        display: 'flex',
        alignItems: 'center',
        gap: '12px',
        flexShrink: 0,
    };

    const handleLogoClick = () => {
        navigate('/app');
    };

    return (
        <header style={headerStyle}>
            {/* Left - Logo */}
            <div style={logoContainerStyle} onClick={handleLogoClick}>
                <ApplicationLogo size="sm" />
            </div>

            {/* Middle - Breadcrumbs and Actions */}
            <div style={middleSectionStyle}>
                {/* Breadcrumbs */}
                {breadcrumbs && breadcrumbs.length > 0 && (
                    <div style={breadcrumbContainerStyle}>
                        <Breadcrumb items={breadcrumbs} />
                    </div>
                )}

                {/* Primary Actions */}
                {actions && (
                    <div style={actionsContainerStyle}>
                        {actions}
                    </div>
                )}

                {/* Secondary Actions */}
                {secondaryActions && (
                    <div style={actionsContainerStyle}>
                        {secondaryActions}
                    </div>
                )}
            </div>

            {/* Right - User Badge */}
            {showUserBadge && (
                <div style={rightSectionStyle}>
                    <UserBadge />
                </div>
            )}
        </header>
    );
};
