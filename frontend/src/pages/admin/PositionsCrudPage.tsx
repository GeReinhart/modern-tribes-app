import React, { useMemo } from 'react';
import { ThemeProvider } from '@/contexts/ThemeContext';
import { AppLayout } from '@/components/layout/AppLayout';
import { adminMainThemeId, AdminNavigation } from '@/components/layout/AdminNavigation';
import { usePositions, usePositionMutations } from '@/hooks/usePositions';
import { Position, PositionCreate, PositionUpdate } from '@/types/position.types';
import { PositionModal } from '@/components/entities/positions/PositionModal';
import { PositionTribeBadge } from '@/components/entities/positions/PositionTribeBadge';
import { PositionPersonBadge } from '@/components/entities/positions/PositionPersonBadge';
import { ThemedCard } from '@/components/common/layout/ThemedCard';
import { ThemedText } from '@/components/common/layout/ThemedText';
import { ThemedButton } from '@/components/common/form/ThemedButton';
import { ThemedTable } from '@/components/common/layout/ThemedTable.tsx';
import { ThemedInput } from '@/components/common/form/ThemedInput.tsx';
import { ThemedConfirmDialog } from '@/components/common/layout/ThemedConfirmDialog.tsx';
import { ThemedLoadingSpinner } from '@/components/common/layout/ThemedLoadingSpinner.tsx';
import { useCrudPage } from '@/hooks/useCrudPage';

const POSITION_LABELS: Record<string, string> = { chief: 'Chief', member: 'Member', invite: 'Guest' };
const getPositionLabel = (code: string) => POSITION_LABELS[code] || code;

const breadcrumbs = [{ label: 'Home', path: '/app' }, { label: 'Admin', path: '/admin' }, { label: 'Positions' }];

const PositionsCrudPageContent: React.FC = () => {
    const { positions, loading, error, refetch } = usePositions();
    const { createPosition, updatePosition, deletePosition, loading: mutationLoading } = usePositionMutations();
    const crud = useCrudPage<Position, PositionCreate, PositionUpdate>(refetch, createPosition, updatePosition, deletePosition);

    const filteredPositions = useMemo(() => {
        if (!crud.filter.trim()) return positions;
        const term = crud.filter.toLowerCase();
        return positions.filter(p => getPositionLabel(p.position).toLowerCase().includes(term));
    }, [positions, crud.filter]);

    const columns = [
        { key: 'tribe', header: 'Tribe', render: (p: Position) => <PositionTribeBadge tribeId={p.tribe_id || null} /> },
        { key: 'position', header: 'Position', render: (p: Position) => <div style={{ fontWeight: 500 }}>{getPositionLabel(p.position)}</div> },
        { key: 'person', header: 'Person', render: (p: Position) => <PositionPersonBadge personId={p.person_id || null} /> },
        { key: 'created_at', header: 'Created', render: (p: Position) => new Date(p.created_at).toLocaleDateString() },
        {
            key: 'actions', header: 'Actions',
            render: (p: Position) => (
                <div style={{ display: 'flex', gap: '8px' }} onClick={e => e.stopPropagation()}>
                    <ThemedButton variant="secondary" onClick={() => crud.openEdit(p)}>Edit</ThemedButton>
                    <ThemedButton variant="danger" onClick={() => crud.openDeleteSingle(p)}>Delete</ThemedButton>
                </div>
            ),
        },
    ];

    const secondaryActions = (
        <>
            <ThemedButton variant="secondary" onClick={crud.openCreate}>Add Position</ThemedButton>
            {crud.selectedRows.size > 0 && (
                <ThemedButton variant="danger" onClick={crud.handleDeleteSelected}>
                    Delete Selected ({crud.selectedRows.size})
                </ThemedButton>
            )}
        </>
    );
    const headerActions = <AdminNavigation currentPage="positions" />;

    if (loading) return (
        <AppLayout breadcrumbs={breadcrumbs} headerActions={headerActions} secondaryActions={secondaryActions}>
            <div style={{ display: 'flex', justifyContent: 'center', padding: '48px' }}><ThemedLoadingSpinner size="sm" /></div>
        </AppLayout>
    );

    return (
        <AppLayout breadcrumbs={breadcrumbs} headerActions={headerActions} secondaryActions={secondaryActions}>
            <ThemedCard>
                <ThemedText variant="primary" size="large" as="h1">Positions</ThemedText>
                <ThemedText size="small">Manage positions</ThemedText>
            </ThemedCard>
            {error && <ThemedCard variant="danger"><ThemedText variant="danger">{error}</ThemedText></ThemedCard>}
            <ThemedCard>
                <ThemedInput label="Filter" value={crud.filter} onChange={e => crud.setFilter(e.target.value)}
                    placeholder="Search by position type..." variant="primary" />
            </ThemedCard>
            <ThemedCard>
                <ThemedTable data={filteredPositions} columns={columns} getRowId={p => p.id}
                    onRowClick={p => crud.openView(p)} selectedRows={crud.selectedRows} onRowSelect={crud.handleRowSelect} />
            </ThemedCard>
            <PositionModal isOpen={crud.modalState.isOpen} onClose={crud.closeModal}
                position={crud.modalState.entity} mode={crud.modalState.mode} onSubmit={crud.handleSubmit} />
            <ThemedConfirmDialog isOpen={crud.deleteDialog.isOpen} onClose={crud.closeDeleteDialog}
                onConfirm={crud.confirmDelete}
                title={crud.deleteDialog.isMultiple ? 'Delete Selected Positions' : 'Delete Position'}
                message={crud.deleteDialog.isMultiple
                    ? `Are you sure you want to delete ${crud.selectedRows.size} position(s)?`
                    : 'Are you sure you want to delete this position?'}
                confirmText="Delete" variant="danger" isLoading={mutationLoading} />
        </AppLayout>
    );
};

export const PositionsCrudPage: React.FC = () => (
    <ThemeProvider defaultTheme={adminMainThemeId}><PositionsCrudPageContent /></ThemeProvider>
);
