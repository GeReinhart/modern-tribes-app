
import React, { useState, useRef, useEffect } from 'react';
import { useTheme } from '@/contexts/ThemeContext';
import { ApplicationLogo } from '@/components/common/icons/ApplicationLogo';
import { useNavigate } from 'react-router-dom';
import { BreadcrumbItem } from './Breadcrumb';
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

    const headerStyle: React.CSSProperties = {
        display: 'flex',
        justifyContent: 'space-between',
        alignItems: 'center',
        padding: 'var(--header-pad)',
        backgroundColor: theme.colors.surface,
        borderBottom: `2px solid ${theme.colors.border}`,
        marginBottom: 'var(--space-lg)',
        gap: 'var(--space-lg)',
    };

    const rightSectionStyle: React.CSSProperties = {
        display: 'flex',
        alignItems: 'center',
        gap: 'var(--space-md)',
        flexShrink: 0,
    };

    const menuStyle: React.CSSProperties = {
        position: 'absolute',
        top: '100%',
        left: 0,
        zIndex: 1000,
        backgroundColor: theme.colors.surface,
        border: `2px solid ${theme.colors.border}`,
        borderRadius: '8px',
        boxShadow: '0 8px 24px rgba(0,0,0,0.15)',
        minWidth: '220px',
        marginTop: 'var(--space-sm)',
        overflow: 'hidden',
    };

    const menuNavItemStyle = (clickable: boolean, isLast: boolean): React.CSSProperties => ({
        padding: 'var(--space-sm) var(--space-md)',
        cursor: clickable ? 'pointer' : 'default',
        color: isLast ? theme.colors.primary : theme.colors.text,
        fontSize: 'var(--font-md)',
        fontWeight: isLast ? 600 : 400,
        borderLeft: isLast ? `3px solid ${theme.colors.primary}` : '3px solid transparent',
        transition: 'background-color 0.15s ease',
    });

    const menuSeparatorStyle: React.CSSProperties = {
        height: '1px',
        backgroundColor: theme.colors.border,
        margin: 'var(--space-xs) 0',
    };

    const menuActionsStyle: React.CSSProperties = {
        display: 'flex',
        flexDirection: 'column',
        gap: 'var(--space-xs)',
        padding: 'var(--space-sm) var(--space-md)',
    };

    const handleNavItem = (path?: string) => {
        if (path) navigate(path);
        setIsMenuOpen(false);
    };

    const hasMenuContent = (breadcrumbs && breadcrumbs.length > 0) || actions || secondaryActions;
    const pageTitle = breadcrumbs && breadcrumbs.length > 0 ? breadcrumbs[breadcrumbs.length - 1].label : undefined;

    return (
        <header style={headerStyle}>
            {/* Left - Logo (menu trigger) */}
            <div ref={menuRef} style={{ position: 'relative', flexShrink: 0 }}>
                <div
                    style={{ cursor: hasMenuContent ? 'pointer' : 'default' }}
                    onClick={() => hasMenuContent && setIsMenuOpen(prev => !prev)}
                    aria-haspopup={hasMenuContent ? 'menu' : undefined}
                    aria-expanded={isMenuOpen}
                >
                    <ApplicationLogo size="sm" />
                </div>

                {isMenuOpen && hasMenuContent && (
                    <div style={menuStyle} role="menu">
                        {/* Breadcrumb navigation items */}
                        {breadcrumbs && breadcrumbs.map((item, index) => {
                            const isLast = index === breadcrumbs.length - 1;
                            const clickable = !isLast && !!item.path;
                            return (
                                <div
                                    key={index}
                                    role="menuitem"
                                    style={menuNavItemStyle(clickable, isLast)}
                                    onClick={() => handleNavItem(item.path)}
                                    onMouseEnter={(e) => {
                                        if (clickable) e.currentTarget.style.backgroundColor = `${theme.colors.primary}10`;
                                    }}
                                    onMouseLeave={(e) => {
                                        if (clickable) e.currentTarget.style.backgroundColor = 'transparent';
                                    }}
                                >
                                    {item.label}
                                </div>
                            );
                        })}

                        {/* Separator between nav items and actions */}
                        {breadcrumbs && breadcrumbs.length > 0 && (actions || secondaryActions) && (
                            <div style={menuSeparatorStyle} />
                        )}

                        {/* Primary actions */}
                        {actions && (
                            <div style={menuActionsStyle}>
                                {actions}
                            </div>
                        )}

                        {/* Secondary actions */}
                        {secondaryActions && (
                            <div style={menuActionsStyle}>
                                {secondaryActions}
                            </div>
                        )}
                    </div>
                )}
            </div>

            {/* Centre - Page title */}
            {pageTitle && (
                <div style={{ flex: 1, minWidth: 0 }}>
                    <span style={{
                        color: theme.colors.text,
                        fontSize: 'var(--font-xl)',
                        fontWeight: 800,
                        overflow: 'hidden',
                        textOverflow: 'ellipsis',
                        whiteSpace: 'nowrap',
                        display: 'block',
                    }}>
                        {pageTitle}
                    </span>
                </div>
            )}

            {/* Right - User Badge */}
            {showUserBadge && (
                <div style={rightSectionStyle}>
                    <UserBadge />
                </div>
            )}
        </header>
    );
};
