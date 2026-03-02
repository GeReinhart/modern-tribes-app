import React, { useMemo } from 'react';
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

const breadcrumbs = [{ label: 'Home', path: '/app' }, { label: 'Admin', path: '/admin' }, { label: 'Projects' }];

const ProjectsCrudPageContent: React.FC = () => {
    const { theme } = useTheme();
    const { projects, loading, error, refetch } = useProjects();
    const { createProject, updateProject, deleteProject, loading: mutationLoading } = useProjectMutations();
    const crud = useCrudPage<Project, ProjectCreate, ProjectUpdate>(refetch, createProject, updateProject, deleteProject);

    const filteredProjects = useMemo(() => {
        if (!crud.filter.trim()) return projects;
        const term = crud.filter.toLowerCase();
        return projects.filter(p => p.name.toLowerCase().includes(term));
    }, [projects, crud.filter]);

    const columns = [
        { key: 'name', header: 'Name', render: (p: Project) => <div style={{ fontWeight: 500 }}>{p.name}</div> },
        {
            key: 'document', header: 'Document',
            render: (p: Project) => (
                <span style={{ fontSize: '12px', color: theme.colors.secondary }}>
                    {p.document_id ? <span style={{ color: theme.colors.primary }}>✓ Attached</span> : 'None'}
                </span>
            ),
        },
        { key: 'created_at', header: 'Created', render: (p: Project) => new Date(p.created_at).toLocaleDateString() },
        {
            key: 'actions', header: 'Actions',
            render: (p: Project) => (
                <div style={{ display: 'flex', gap: '8px' }} onClick={e => e.stopPropagation()}>
                    <ThemedButton variant="secondary" onClick={() => crud.openEdit(p)}>Edit</ThemedButton>
                    <ThemedButton variant="danger" onClick={() => crud.openDeleteSingle(p)}>Delete</ThemedButton>
                </div>
            ),
        },
    ];

    const secondaryActions = (
        <>
            <ThemedButton variant="secondary" onClick={crud.openCreate}>Add Project</ThemedButton>
            {crud.selectedRows.size > 0 && (
                <ThemedButton variant="danger" onClick={crud.handleDeleteSelected}>
                    Delete Selected ({crud.selectedRows.size})
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
                <ThemedText variant="primary" size="large" as="h1">Projects</ThemedText>
                <ThemedText size="small">Manage projects</ThemedText>
            </ThemedCard>
            {error && <ThemedCard variant="danger"><ThemedText variant="danger">{error}</ThemedText></ThemedCard>}
            <ThemedCard>
                <ThemedInput label="Filter" value={crud.filter} onChange={e => crud.setFilter(e.target.value)}
                    placeholder="Search by name..." variant="primary" />
            </ThemedCard>
            <ThemedCard>
                <ThemedTable data={filteredProjects} columns={columns} getRowId={p => p.id}
                    onRowClick={p => crud.openView(p)} selectedRows={crud.selectedRows} onRowSelect={crud.handleRowSelect} />
            </ThemedCard>
            <ProjectModal isOpen={crud.modalState.isOpen} onClose={crud.closeModal}
                project={crud.modalState.entity} mode={crud.modalState.mode} onSubmit={crud.handleSubmit} />
            <ThemedConfirmDialog isOpen={crud.deleteDialog.isOpen} onClose={crud.closeDeleteDialog}
                onConfirm={crud.confirmDelete}
                title={crud.deleteDialog.isMultiple ? 'Delete Selected Projects' : 'Delete Project'}
                message={crud.deleteDialog.isMultiple
                    ? `Are you sure you want to delete ${crud.selectedRows.size} project(s)?`
                    : `Are you sure you want to delete "${crud.deleteDialog.entity?.name}"?`}
                confirmText="Delete" variant="danger" isLoading={mutationLoading} />
        </AppLayout>
    );
};

export const ProjectsCrudPage: React.FC = () => (
    <ThemeProvider defaultTheme={adminMainThemeId}><ProjectsCrudPageContent /></ThemeProvider>
);
