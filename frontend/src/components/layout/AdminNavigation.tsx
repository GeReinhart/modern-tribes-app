import React from 'react';
import { useNavigate } from 'react-router-dom';
import { useTranslation } from 'react-i18next';
import { ThemedButton } from '@/components/common/form/ThemedButton';

type AdminPage = 'users' | 'persons' | 'roles' | 'permissions' | 'positions' | 'represents' | 'tribes' | 'projects' | 'documents' | 'monitoring';

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
        { page: 'users',       labelKey: 'admin.users',       path: '/admin/users' },
        { page: 'persons',     labelKey: 'admin.persons',     path: '/admin/persons' },
        { page: 'roles',       labelKey: 'admin.roles',       path: '/admin/roles' },
        { page: 'permissions', labelKey: 'admin.permissions', path: '/admin/permissions' },
        { page: 'positions',   labelKey: 'admin.positions',   path: '/admin/positions' },
        { page: 'represents',  labelKey: 'admin.represents',  path: '/admin/represents' },
        { page: 'tribes',      labelKey: 'admin.tribes',      path: '/admin/tribes' },
        { page: 'projects',    labelKey: 'admin.projects',    path: '/admin/projects' },
        { page: 'documents',   labelKey: 'admin.documents',   path: '/admin/documents' },
    ];

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
                    variant={page === 'app' ? 'ghost' : currentPage === page ? 'secondary' : 'primary'}
                    onClick={() => navigate(path)}
                >
                    {t(labelKey)}
                </ThemedButton>
            ))}
        </div>
    );
};
