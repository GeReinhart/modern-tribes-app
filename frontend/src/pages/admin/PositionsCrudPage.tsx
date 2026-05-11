import React, { useMemo } from 'react';
import { useTranslation } from 'react-i18next';
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

const PositionsCrudPageContent: React.FC = () => {
    const { t } = useTranslation();
    const { positions, loading, error, refetch } = usePositions();
    const { createPosition, updatePosition, deletePosition, loading: mutationLoading } = usePositionMutations();
    const crud = useCrudPage<Position, PositionCreate, PositionUpdate>(refetch, createPosition, updatePosition, deletePosition);

    const breadcrumbs = useMemo(() => [
        { label: t('common.home'), path: '/app' },
        { label: t('common.admin'), path: '/admin' },
        { label: t('admin.positions') },
    ], [t]);

    const getPositionLabel = (code: string) => {
        const labels: Record<string, string> = {
            chief: t('positions.chief'),
            member: t('positions.member'),
            invite: t('positions.guest'),
        };
        return labels[code] || code;
    };

    const filteredPositions = useMemo(() => {
        if (!crud.filter.trim()) return positions;
        const term = crud.filter.toLowerCase();
        return positions.filter(p => getPositionLabel(p.position).toLowerCase().includes(term));
    }, [positions, crud.filter, t]);

    const columns = useMemo(() => [
        { key: 'tribe', header: t('admin.columnTribe'), render: (p: Position) => <PositionTribeBadge tribeId={p.tribe_id || null} /> },
        { key: 'position', header: t('admin.columnPosition'), render: (p: Position) => <div style={{ fontWeight: 500 }}>{getPositionLabel(p.position)}</div> },
        { key: 'person', header: t('admin.columnPerson'), render: (p: Position) => <PositionPersonBadge personId={p.person_id || null} /> },
        { key: 'created_at', header: t('common.created'), render: (p: Position) => new Date(p.created_at).toLocaleDateString() },
        {
            key: 'actions', header: t('common.actions'),
            render: (p: Position) => (
                <div style={{ display: 'flex', gap: '8px' }} onClick={e => e.stopPropagation()}>
                    <ThemedButton variant="secondary" onClick={() => crud.openEdit(p)}>{t('common.edit')}</ThemedButton>
                    <ThemedButton variant="danger" onClick={() => crud.openDeleteSingle(p)}>{t('common.delete')}</ThemedButton>
                </div>
            ),
        },
    ], [t, crud]);

    const secondaryActions = (
        <>
            <ThemedButton variant="secondary" onClick={crud.openCreate}>{t('admin.addPosition')}</ThemedButton>
            {crud.selectedRows.size > 0 && (
                <ThemedButton variant="danger" onClick={crud.handleDeleteSelected}>
                    {t('admin.deleteSelected', { count: crud.selectedRows.size })}
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
                <ThemedText variant="primary" size="large" as="h1">{t('admin.positions')}</ThemedText>
                <ThemedText size="small">{t('admin.positionsSubtitle')}</ThemedText>
            </ThemedCard>
            {error && <ThemedCard variant="danger"><ThemedText variant="danger">{error}</ThemedText></ThemedCard>}
            <ThemedCard>
                <ThemedInput label={t('common.filter')} value={crud.filter} onChange={e => crud.setFilter(e.target.value)}
                    placeholder={t('admin.searchPositionType')} variant="primary" />
            </ThemedCard>
            <ThemedCard>
                <ThemedTable data={filteredPositions} columns={columns} getRowId={p => p.id}
                    onRowClick={p => crud.openView(p)} selectedRows={crud.selectedRows} onRowSelect={crud.handleRowSelect} />
            </ThemedCard>
            <PositionModal isOpen={crud.modalState.isOpen} onClose={crud.closeModal}
                position={crud.modalState.entity} mode={crud.modalState.mode} onSubmit={crud.handleSubmit} />
            <ThemedConfirmDialog isOpen={crud.deleteDialog.isOpen} onClose={crud.closeDeleteDialog}
                onConfirm={crud.confirmDelete}
                title={crud.deleteDialog.isMultiple ? t('admin.deleteSelectedPositions') : t('admin.deletePosition')}
                message={crud.deleteDialog.isMultiple
                    ? t('admin.confirmDeleteSelected', { count: crud.selectedRows.size })
                    : t('admin.confirmDeletePosition')}
                confirmText={t('common.delete')} variant="danger" isLoading={mutationLoading} />
        </AppLayout>
    );
};

export const PositionsCrudPage: React.FC = () => (
    <ThemeProvider defaultTheme={adminMainThemeId}><PositionsCrudPageContent /></ThemeProvider>
);
