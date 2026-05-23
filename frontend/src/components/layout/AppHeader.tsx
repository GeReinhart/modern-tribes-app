
import React, { useState, useRef, useEffect } from 'react';
import { useTheme } from '@/contexts/ThemeContext';
import { ApplicationLogo } from '@/components/common/icons/ApplicationLogo';
import { ThemedSvgIcon, IconName } from '@/components/common/icons/ThemedSvgIcon';
import { useNavigate, useLocation } from 'react-router-dom';
import { useTranslation } from 'react-i18next';
import { BreadcrumbItem, BreadcrumbTab } from './Breadcrumb';
import UserBadge from "@/components/entities/users/CurrentUserBadge.tsx";
import { BookmarkToggle } from '@/features/bookmarks/BookmarkToggle';



interface AppHeaderProps {
    actions?: React.ReactNode;
    secondaryActions?: React.ReactNode;
    showUserBadge?: boolean;
    breadcrumbs?: BreadcrumbItem[];
    breadcrumbTabs?: BreadcrumbTab[];
    bookmarkTitle?: string | null;
}

export const AppHeader: React.FC<AppHeaderProps> = ({
                                                        actions,
                                                        secondaryActions,
                                                        showUserBadge = true,
                                                        breadcrumbs,
                                                        breadcrumbTabs,
                                                        bookmarkTitle,
                                                    }) => {
    const { theme, currentThemeKey } = useTheme();
    const navigate = useNavigate();
    const location = useLocation();
    const { t } = useTranslation();
    const isSearchActive = location.pathname === '/app/search';
    const isAboutActive = location.pathname === '/app/about';
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
        position: 'sticky',
        top: 0,
        zIndex: 100,
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
        borderRadius: '12px',
        boxShadow: '0 8px 24px rgba(0,0,0,0.15)',
        minWidth: breadcrumbTabs ? '360px' : '330px',
        maxWidth: 'calc(100vw - 16px)',
        marginTop: '12px',
        overflow: 'hidden',
        boxSizing: 'border-box',
    };

    const menuNavItemStyle = (clickable: boolean, isLast: boolean): React.CSSProperties => ({
        padding: '12px 24px',
        cursor: clickable ? 'pointer' : 'default',
        color: isLast ? theme.colors.primary : theme.colors.text,
        fontSize: 'calc(var(--btn-font) * 1.2)',
        fontWeight: isLast ? 700 : 600,
        borderLeft: isLast ? `3px solid ${theme.colors.primary}` : '3px solid transparent',
        transition: 'background-color 0.15s ease',
    });

    const menuSeparatorStyle: React.CSSProperties = {
        height: '1px',
        backgroundColor: theme.colors.border,
        margin: '6px 0',
    };

    const menuActionsStyle: React.CSSProperties = {
        display: 'grid',
        gridTemplateColumns: 'repeat(2, 1fr)',
        gap: '6px',
        padding: '12px 24px',
    };

    const menuSecondaryActionsStyle: React.CSSProperties = {
        display: 'grid',
        gridTemplateColumns: 'repeat(2, 1fr)',
        gap: '6px',
        padding: '12px 24px',
    };

    const handleNavItem = (path?: string) => {
        if (path) navigate(path);
        setIsMenuOpen(false);
    };

    const hasMenuContent = true;
    const hasPrecedingMenuContent = (breadcrumbs && breadcrumbs.length > 0) || actions || secondaryActions;
    const pageTitle = breadcrumbs && breadcrumbs.length > 0 ? breadcrumbs[breadcrumbs.length - 1].label : undefined;
    const bookmarkDescription = breadcrumbs && breadcrumbs.length > 0
        ? breadcrumbs.map(b => b.label).join(' / ')
        : null;

    return (
        <header style={headerStyle}>
            {/* Left - Logo (menu trigger) */}
            <div ref={menuRef} style={{ position: 'relative', flexShrink: 0 }}>
                <div
                    className="header-logo"
                    style={{ cursor: hasMenuContent ? 'pointer' : 'default' }}
                    onClick={() => hasMenuContent && setIsMenuOpen(prev => !prev)}
                    aria-haspopup={hasMenuContent ? 'menu' : undefined}
                    aria-expanded={isMenuOpen}
                >
                    <ApplicationLogo size="sm" themeId={currentThemeKey} />
                </div>

                {isMenuOpen && hasMenuContent && (
                    <div style={menuStyle} role="menu">
                        {/* Breadcrumb navigation — single or two-column layout */}
                        {breadcrumbs && breadcrumbs.length > 0 && (
                            <div style={{ display: 'grid', gridTemplateColumns: breadcrumbTabs ? '1fr 1fr' : '1fr', borderBottom: (secondaryActions || actions) ? `1px solid ${theme.colors.border}` : undefined }}>
                                <div>
                                    {breadcrumbs.map((item, index) => {
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
                                </div>
                                {breadcrumbTabs && (
                                    <div style={{ borderLeft: `1px solid ${theme.colors.border}` }}>
                                        {breadcrumbTabs.map((tab) => (
                                            <div
                                                key={tab.key}
                                                role="menuitem"
                                                style={menuNavItemStyle(true, tab.isActive)}
                                                onClick={() => handleNavItem(tab.path)}
                                                onMouseEnter={(e) => {
                                                    if (!tab.isActive) e.currentTarget.style.backgroundColor = `${theme.colors.primary}10`;
                                                }}
                                                onMouseLeave={(e) => {
                                                    if (!tab.isActive) e.currentTarget.style.backgroundColor = 'transparent';
                                                }}
                                            >
                                                {tab.label}
                                            </div>
                                        ))}
                                    </div>
                                )}
                            </div>
                        )}


                        {/* Current page actions */}
                        {secondaryActions && (
                            <div style={menuSecondaryActionsStyle} onClick={() => setIsMenuOpen(false)}>
                                {secondaryActions}
                            </div>
                        )}

                        {/* Separator between current page actions and admin nav */}
                        {secondaryActions && actions && (
                            <div style={menuSeparatorStyle} />
                        )}

                        {/* Admin navigation */}
                        {actions && (
                            <div style={menuActionsStyle} onClick={() => setIsMenuOpen(false)}>
                                {actions}
                            </div>
                        )}

                        {/* Separator before app nav */}
                        {hasPrecedingMenuContent && <div style={menuSeparatorStyle} />}

                        {/* App navigation — Search & About */}
                        {([
                            { path: '/app/search', icon: 'search' as IconName, label: t('search.title'), active: isSearchActive },
                            { path: '/app/about',  icon: 'info'   as IconName, label: t('about.title'),  active: isAboutActive  },
                        ]).map(item => (
                            <div
                                key={item.path}
                                role="menuitem"
                                style={{ ...menuNavItemStyle(true, item.active), display: 'flex', alignItems: 'center', gap: '10px' }}
                                onClick={() => handleNavItem(item.path)}
                                onMouseEnter={(e) => {
                                    if (!item.active) e.currentTarget.style.backgroundColor = `${theme.colors.primary}10`;
                                }}
                                onMouseLeave={(e) => {
                                    if (!item.active) e.currentTarget.style.backgroundColor = 'transparent';
                                }}
                            >
                                <ThemedSvgIcon name={item.icon} color={item.active ? theme.colors.primary : theme.colors.text} size={16} />
                                {item.label}
                            </div>
                        ))}
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
                        display: 'block',
                        wordBreak: 'break-word',
                    }}>
                        {pageTitle}
                    </span>
                </div>
            )}

            {/* Right - Bookmark + User Badge */}
            {showUserBadge && (
                <div style={rightSectionStyle}>
                    {bookmarkTitle && (
                        <BookmarkToggle pagePath={location.pathname} pageTitle={bookmarkTitle} pageDescription={bookmarkDescription} />
                    )}
                    <UserBadge />
                </div>
            )}
        </header>
    );
};
