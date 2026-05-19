import React from 'react';
import { useNavigate } from 'react-router-dom';
import { useTranslation } from 'react-i18next';
import { ThemedButton } from '@/components/common/form/ThemedButton';
import { predefinedThemes } from '@/components/themes/themes';

type AdminPage = 'authorization' | 'tribes' | 'documents' | 'monitoring' | 'mails' | 'people';

interface AdminNavigationProps {
    currentPage: AdminPage;
}

export const adminMainThemeId: string = "alt_05"

export const AdminNavigation: React.FC<AdminNavigationProps> = ({ currentPage }) => {
    const navigate = useNavigate();
    const { t } = useTranslation();

    const items: Array<{ page: AdminPage | 'app'; labelKey: string; path: string }> = [
        { page: 'app',         labelKey: 'admin.app',         path: '/app' },
        { page: 'monitoring',  labelKey: 'admin.monitoring',  path: '/admin/monitoring' },
        { page: 'mails',       labelKey: 'admin.mails.nav',   path: '/admin/mails' },
        { page: 'people',      labelKey: 'admin.people',      path: '/admin/people' },
        { page: 'authorization', labelKey: 'admin.authorization', path: '/admin/authorization' },
        { page: 'tribes', labelKey: 'admin.tribes', path: '/admin/tribes' },
        { page: 'documents',       labelKey: 'admin.documents',       path: '/admin/documents' },

    ];

    const adminTheme = predefinedThemes[adminMainThemeId];
    const cols = items.length > 14 ? 3 : items.length > 7 ? 2 : 1;

    return (
        <div style={{
            display: 'grid',
            gridTemplateColumns: `repeat(${cols}, 1fr)`,
            gap: 'var(--space-xs)',
        }}>
            {items.map(({ page, labelKey, path }) => (
                <ThemedButton
                    key={page}
                    theme={adminTheme}
                    variant={page === 'app' ? 'ghost' : currentPage === page ? 'secondary' : 'primary'}
                    onClick={() => navigate(path)}
                >
                    {t(labelKey)}
                </ThemedButton>
            ))}
        </div>
    );
};
