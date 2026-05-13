import React, { useMemo } from 'react';
import { useTranslation } from 'react-i18next';
import { ThemeProvider, useTheme } from '@/contexts/ThemeContext';
import { AppLayout } from '@/components/layout/AppLayout';
import { adminMainThemeId, AdminNavigation } from '@/components/layout/AdminNavigation';
import { useProjects, useProjectMutations } from '@/hooks/useProjects';
import { Project, ProjectCreate, ProjectUpdate } from '@/types/project.types';
import { ProjectModal } from '@/components/entities/projects/ProjectModal';
import { ThemedCard } from '@/components/common/layout/ThemedCard';
import { ThemedText } from '@/components/common/layout/ThemedText';
import { ThemedButton } from '@/components/common/form/ThemedButton';
import { ThemedTable } from '@/components/common/layout/ThemedTable.tsx';
import { ThemedInput } from '@/components/common/form/ThemedInput.tsx';
import { ThemedConfirmDialog } from '@/components/common/layout/ThemedConfirmDialog.tsx';
import { ThemedLoadingSpinner } from '@/components/common/layout/ThemedLoadingSpinner.tsx';
import { useCrudPage } from '@/hooks/useCrudPage';

const ProjectsCrudPageContent: React.FC = () => {
    const { t } = useTranslation();
    const { theme } = useTheme();
    const { projects, loading, error, refetch } = useProjects();
    const { createProject, updateProject, deleteProject, loading: mutationLoading } = useProjectMutations();
    const crud = useCrudPage<Project, ProjectCreate, ProjectUpdate>(refetch, createProject, updateProject, deleteProject);

    const breadcrumbs = useMemo(() => [
        { label: t('common.home'), path: '/app' },
        { label: t('common.admin'), path: '/admin' },
        { label: t('admin.projects') },
    ], [t]);

    const filteredProjects = useMemo(() => {
        if (!crud.filter.trim()) return projects;
        const term = crud.filter.toLowerCase();
        return projects.filter(p => p.name.toLowerCase().includes(term));
    }, [projects, crud.filter]);

    const columns = useMemo(() => [
        { key: 'name', header: t('common.name'), render: (p: Project) => <div style={{ fontWeight: 500 }}>{p.name}</div> },
        {
            key: 'document', header: t('admin.columnDocument'),
            render: (p: Project) => (
                <span style={{ fontSize: '12px', color: theme.colors.secondary }}>
                    {p.document_id ? <span style={{ color: theme.colors.primary }}>{t('admin.attached')}</span> : t('admin.none')}
                </span>
            ),
        },
        { key: 'created_at', header: t('common.created'), render: (p: Project) => new Date(p.created_at).toLocaleDateString() },
        {
            key: 'actions', header: t('common.actions'),
            render: (p: Project) => (
                <div style={{ display: 'flex', gap: '8px' }} onClick={e => e.stopPropagation()}>
                    <ThemedButton variant="secondary" onClick={() => crud.openEdit(p)}>{t('common.edit')}</ThemedButton>
                    <ThemedButton variant="danger" onClick={() => crud.openDeleteSingle(p)}>{t('common.delete')}</ThemedButton>
                </div>
            ),
        },
    ], [t, theme.colors.secondary, theme.colors.primary, crud]);

    const secondaryActions = (
        <>
            <ThemedButton variant="secondary" onClick={crud.openCreate}>{t('admin.addProject')}</ThemedButton>
            {crud.selectedRows.size > 0 && (
                <ThemedButton variant="danger" onClick={crud.handleDeleteSelected}>
                    {t('admin.deleteSelected', { count: crud.selectedRows.size })}
                </ThemedButton>
            )}
        </>
    );
    const headerActions = <AdminNavigation currentPage="projects" />;

    if (loading) return (
        <AppLayout breadcrumbs={breadcrumbs} headerActions={headerActions} secondaryActions={secondaryActions}>
            <div style={{ display: 'flex', justifyContent: 'center', padding: '48px' }}><ThemedLoadingSpinner size="sm" /></div>
        </AppLayout>
    );

    return (
        <AppLayout breadcrumbs={breadcrumbs} headerActions={headerActions} secondaryActions={secondaryActions}>
            <ThemedCard>

                <ThemedText size="small">{t('admin.projectsSubtitle')}</ThemedText>
            </ThemedCard>
            {error && <ThemedCard variant="danger"><ThemedText variant="danger">{error}</ThemedText></ThemedCard>}
            <ThemedCard>
                <ThemedInput label={t('common.filter')} value={crud.filter} onChange={e => crud.setFilter(e.target.value)}
                    placeholder={t('admin.searchName')} variant="primary" />
            </ThemedCard>
            <ThemedCard>
                <ThemedTable data={filteredProjects} columns={columns} getRowId={p => p.id}
                    onRowClick={p => crud.openView(p)} selectedRows={crud.selectedRows} onRowSelect={crud.handleRowSelect} />
            </ThemedCard>
            <ProjectModal isOpen={crud.modalState.isOpen} onClose={crud.closeModal}
                project={crud.modalState.entity} mode={crud.modalState.mode} onSubmit={crud.handleSubmit} />
            <ThemedConfirmDialog isOpen={crud.deleteDialog.isOpen} onClose={crud.closeDeleteDialog}
                onConfirm={crud.confirmDelete}
                title={crud.deleteDialog.isMultiple ? t('admin.deleteSelectedProjects') : t('admin.deleteProject')}
                message={crud.deleteDialog.isMultiple
                    ? t('admin.confirmDeleteSelected', { count: crud.selectedRows.size })
                    : t('admin.confirmDeleteNamed', { name: crud.deleteDialog.entity?.name })}
                confirmText={t('common.delete')} variant="danger" isLoading={mutationLoading} />
        </AppLayout>
    );
};

export const ProjectsCrudPage: React.FC = () => (
    <ThemeProvider defaultTheme={adminMainThemeId}><ProjectsCrudPageContent /></ThemeProvider>
);
