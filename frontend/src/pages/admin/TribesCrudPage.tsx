import React, { useMemo } from 'react';
import { ThemeProvider, useTheme } from '@/contexts/ThemeContext';
import { AppLayout } from '@/components/layout/AppLayout';
import { adminMainThemeId, AdminNavigation } from '@/components/layout/AdminNavigation';
import { useTribes, useTribeMutations } from '@/hooks/useTribes';
import { Tribe, TribeCreate, TribeUpdate } from '@/types/tribe.types';
import { TribeModal } from '@/components/entities/tribes/TribeModal';
import { ThemedCard } from '@/components/common/layout/ThemedCard';
import { ThemedText } from '@/components/common/layout/ThemedText';
import { ThemedButton } from '@/components/common/form/ThemedButton';
import { ThemedTable } from '@/components/common/layout/ThemedTable.tsx';
import { ThemedInput } from '@/components/common/form/ThemedInput.tsx';
import { ThemedConfirmDialog } from '@/components/common/layout/ThemedConfirmDialog.tsx';
import { ThemedLoadingSpinner } from '@/components/common/layout/ThemedLoadingSpinner.tsx';
import { useCrudPage } from '@/hooks/useCrudPage';

const breadcrumbs = [{ label: 'Home', path: '/app' }, { label: 'Admin', path: '/admin' }, { label: 'Tribes' }];

const TribesCrudPageContent: React.FC = () => {
    const { theme } = useTheme();
    const { tribes, loading, error, refetch } = useTribes();
    const { createTribe, updateTribe, deleteTribe, loading: mutationLoading } = useTribeMutations();
    const crud = useCrudPage<Tribe, TribeCreate, TribeUpdate>(refetch, createTribe, updateTribe, deleteTribe);

    const filteredTribes = useMemo(() => {
        if (!crud.filter.trim()) return tribes;
        const term = crud.filter.toLowerCase();
        return tribes.filter(t => t.name.toLowerCase().includes(term));
    }, [tribes, crud.filter]);

    const columns = [
        { key: 'name', header: 'Name', render: (t: Tribe) => <div style={{ fontWeight: 500 }}>{t.name}</div> },
        {
            key: 'document', header: 'Document',
            render: (t: Tribe) => (
                <span style={{ fontSize: '12px', color: theme.colors.secondary }}>
                    {t.document_id ? <span style={{ color: theme.colors.primary }}>✓ Attached</span> : 'None'}
                </span>
            ),
        },
        { key: 'created_at', header: 'Created', render: (t: Tribe) => new Date(t.created_at).toLocaleDateString() },
        {
            key: 'actions', header: 'Actions',
            render: (t: Tribe) => (
                <div style={{ display: 'flex', gap: '8px' }} onClick={e => e.stopPropagation()}>
                    <ThemedButton variant="secondary" onClick={() => crud.openEdit(t)}>Edit</ThemedButton>
                    <ThemedButton variant="danger" onClick={() => crud.openDeleteSingle(t)}>Delete</ThemedButton>
                </div>
            ),
        },
    ];

    const secondaryActions = (
        <>
            <ThemedButton variant="secondary" onClick={crud.openCreate}>Add Tribe</ThemedButton>
            {crud.selectedRows.size > 0 && (
                <ThemedButton variant="danger" onClick={crud.handleDeleteSelected}>
                    Delete Selected ({crud.selectedRows.size})
                </ThemedButton>
            )}
        </>
    );
    const headerActions = <AdminNavigation currentPage="tribes" />;

    if (loading) return (
        <AppLayout breadcrumbs={breadcrumbs} headerActions={headerActions} secondaryActions={secondaryActions}>
            <div style={{ display: 'flex', justifyContent: 'center', padding: '48px' }}><ThemedLoadingSpinner size="sm" /></div>
        </AppLayout>
    );

    return (
        <AppLayout breadcrumbs={breadcrumbs} headerActions={headerActions} secondaryActions={secondaryActions}>
            <ThemedCard>
                <ThemedText variant="primary" size="large" as="h1">Tribes</ThemedText>
                <ThemedText size="small">Manage tribes</ThemedText>
            </ThemedCard>
            {error && <ThemedCard variant="danger"><ThemedText variant="danger">{error}</ThemedText></ThemedCard>}
            <ThemedCard>
                <ThemedInput label="Filter" value={crud.filter} onChange={e => crud.setFilter(e.target.value)}
                    placeholder="Search by name..." variant="primary" />
            </ThemedCard>
            <ThemedCard>
                <ThemedTable data={filteredTribes} columns={columns} getRowId={t => t.id}
                    onRowClick={t => crud.openView(t)} selectedRows={crud.selectedRows} onRowSelect={crud.handleRowSelect} />
            </ThemedCard>
            <TribeModal isOpen={crud.modalState.isOpen} onClose={crud.closeModal}
                tribe={crud.modalState.entity} mode={crud.modalState.mode} onSubmit={crud.handleSubmit} />
            <ThemedConfirmDialog isOpen={crud.deleteDialog.isOpen} onClose={crud.closeDeleteDialog}
                onConfirm={crud.confirmDelete}
                title={crud.deleteDialog.isMultiple ? 'Delete Selected Tribes' : 'Delete Tribe'}
                message={crud.deleteDialog.isMultiple
                    ? `Are you sure you want to delete ${crud.selectedRows.size} tribe(s)?`
                    : `Are you sure you want to delete "${crud.deleteDialog.entity?.name}"?`}
                confirmText="Delete" variant="danger" isLoading={mutationLoading} />
        </AppLayout>
    );
};

export const TribesCrudPage: React.FC = () => (
    <ThemeProvider defaultTheme={adminMainThemeId}><TribesCrudPageContent /></ThemeProvider>
);
