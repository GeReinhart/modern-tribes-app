import React from 'react';
import { useNavigate } from 'react-router-dom';
import { ThemedButton } from '@/components/common/form/ThemedButton';

interface AdminNavigationProps {
    currentPage: 'users' | 'persons' | 'roles' | 'permissions' | 'positions' | 'tribes' | 'projects' | 'documents';
}

export const adminMainThemeId: string = "alt_05"

export const AdminNavigation: React.FC<AdminNavigationProps> = ({ currentPage }) => {
    const navigate = useNavigate();

    return (
        <>
            <ThemedButton variant="ghost" onClick={() => navigate('/app')}>
                App
            </ThemedButton>
            <ThemedButton
                variant={currentPage === 'users' ? 'secondary' : 'primary'}
                onClick={() => navigate('/admin/users')}
            >
                Users
            </ThemedButton>
            <ThemedButton
                variant={currentPage === 'persons' ? 'secondary' : 'primary'}
                onClick={() => navigate('/admin/persons')}
            >
                Persons
            </ThemedButton>
            <ThemedButton
                variant={currentPage === 'roles' ? 'secondary' : 'primary'}
                onClick={() => navigate('/admin/roles')}
            >
                Roles
            </ThemedButton>
            <ThemedButton
                variant={currentPage === 'permissions' ? 'secondary' : 'primary'}
                onClick={() => navigate('/admin/permissions')}
            >
                Permissions
            </ThemedButton>
            <ThemedButton
                variant={currentPage === 'positions' ? 'secondary' : 'primary'}
                onClick={() => navigate('/admin/positions')}
            >
                Positions
            </ThemedButton>
            <ThemedButton
                variant={currentPage === 'tribes' ? 'secondary' : 'primary'}
                onClick={() => navigate('/admin/tribes')}
            >
                Tribes
            </ThemedButton>
            <ThemedButton
                variant={currentPage === 'projects' ? 'secondary' : 'primary'}
                onClick={() => navigate('/admin/projects')}
            >
                Projects
            </ThemedButton>
            <ThemedButton
                variant={currentPage === 'documents' ? 'secondary' : 'primary'}
                onClick={() => navigate('/admin/documents')}
            >
                Documents
            </ThemedButton>
        </>
    );
};
