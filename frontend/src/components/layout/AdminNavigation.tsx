import React from 'react';
import { useNavigate } from 'react-router-dom';
import { useTranslation } from 'react-i18next';
import { ThemedButton } from '@/components/common/form/ThemedButton';

interface AdminNavigationProps {
    currentPage: 'users' | 'persons' | 'roles' | 'permissions' | 'positions' | 'tribes' | 'projects' | 'documents' | 'monitoring';
}

export const adminMainThemeId: string = "alt_05"

export const AdminNavigation: React.FC<AdminNavigationProps> = ({ currentPage }) => {
    const navigate = useNavigate();
    const { t } = useTranslation();

    return (
        <>
            <ThemedButton variant="ghost" onClick={() => navigate('/app')}>
                {t('admin.app')}
            </ThemedButton>
            <ThemedButton
                variant={currentPage === 'monitoring' ? 'secondary' : 'primary'}
                onClick={() => navigate('/admin/monitoring')}
            >
                    {t('admin.monitoring')}
            </ThemedButton>
            <ThemedButton
                variant={currentPage === 'users' ? 'secondary' : 'primary'}
                onClick={() => navigate('/admin/users')}
            >
                {t('admin.users')}
            </ThemedButton>
            <ThemedButton
                variant={currentPage === 'persons' ? 'secondary' : 'primary'}
                onClick={() => navigate('/admin/persons')}
            >
                {t('admin.persons')}
            </ThemedButton>
            <ThemedButton
                variant={currentPage === 'roles' ? 'secondary' : 'primary'}
                onClick={() => navigate('/admin/roles')}
            >
                {t('admin.roles')}
            </ThemedButton>
            <ThemedButton
                variant={currentPage === 'permissions' ? 'secondary' : 'primary'}
                onClick={() => navigate('/admin/permissions')}
            >
                {t('admin.permissions')}
            </ThemedButton>
            <ThemedButton
                variant={currentPage === 'positions' ? 'secondary' : 'primary'}
                onClick={() => navigate('/admin/positions')}
            >
                {t('admin.positions')}
            </ThemedButton>
            <ThemedButton
                variant={currentPage === 'tribes' ? 'secondary' : 'primary'}
                onClick={() => navigate('/admin/tribes')}
            >
                {t('admin.tribes')}
            </ThemedButton>
            <ThemedButton
                variant={currentPage === 'projects' ? 'secondary' : 'primary'}
                onClick={() => navigate('/admin/projects')}
            >
                {t('admin.projects')}
            </ThemedButton>
            <ThemedButton
                variant={currentPage === 'documents' ? 'secondary' : 'primary'}
                onClick={() => navigate('/admin/documents')}
            >
                {t('admin.documents')}
            </ThemedButton>

        </>
    );
};
