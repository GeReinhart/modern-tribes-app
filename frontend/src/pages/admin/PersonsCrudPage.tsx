import React, { useMemo } from 'react';
import { useTranslation } from 'react-i18next';
import { ThemeProvider, useTheme } from '@/contexts/ThemeContext';
import { AppLayout } from '@/components/layout/AppLayout';
import { adminMainThemeId, AdminNavigation } from '@/components/layout/AdminNavigation';
import { usePersons, usePersonMutations } from '@/hooks/usePersons';
import { Person, PersonCreate, PersonUpdate } from '@/types/person.types';
import { PersonModal } from '@/components/entities/persons/PersonModal';
import { ThemedCard } from '@/components/common/layout/ThemedCard';
import { ThemedText } from '@/components/common/layout/ThemedText';
import { ThemedButton } from '@/components/common/form/ThemedButton';
import { ThemedTable } from '@/components/common/layout/ThemedTable.tsx';
import { ThemedInput } from '@/components/common/form/ThemedInput.tsx';
import { ThemedConfirmDialog } from '@/components/common/layout/ThemedConfirmDialog.tsx';
import { ThemedLoadingSpinner } from '@/components/common/layout/ThemedLoadingSpinner.tsx';
import { useCrudPage } from '@/hooks/useCrudPage';

const PersonsCrudPageContent: React.FC = () => {
    const { t } = useTranslation();
    const { theme } = useTheme();
    const { persons, loading, error, refetch } = usePersons();
    const { createPerson, updatePerson, deletePerson, loading: mutationLoading } = usePersonMutations();
    const crud = useCrudPage<Person, PersonCreate, PersonUpdate>(refetch, createPerson, updatePerson, deletePerson);

    const breadcrumbs = useMemo(() => [
        { label: t('common.home'), path: '/app' },
        { label: t('common.admin'), path: '/admin' },
        { label: t('admin.persons') },
    ], [t]);

    const getGenderLabel = (gender: string) => {
        const labels: Record<string, string> = {
            male: t('admin.genderMale'),
            female: t('admin.genderFemale'),
            other: t('admin.genderOther'),
            prefer_not_to_say: t('admin.genderPreferNot'),
        };
        return labels[gender] || gender;
    };

    const filteredPersons = useMemo(() => {
        if (!crud.filter.trim()) return persons;
        const term = crud.filter.toLowerCase();
        return persons.filter(p => [
            p.first_name, p.last_name, `${p.first_name} ${p.last_name}`,
            p.gender, getGenderLabel(p.gender), p.id,
            new Date(p.created_at).toLocaleDateString(),
        ].join(' ').toLowerCase().includes(term));
    }, [persons, crud.filter, t]);

    const columns = useMemo(() => [
        {
            key: 'name', header: t('common.name'),
            render: (p: Person) => (
                <div>
                    <div style={{ fontWeight: 500 }}>{p.first_name} {p.last_name}</div>
                    <div style={{ fontSize: '12px', color: theme.colors.secondary }}>{getGenderLabel(p.gender)}</div>
                </div>
            ),
        },
        {
            key: 'created_at', header: t('common.created'),
            render: (p: Person) => (
                <div>
                    <div>{new Date(p.created_at).toLocaleDateString()}</div>
                    <div style={{ fontSize: '11px', color: theme.colors.secondary }}>
                        {new Date(p.created_at).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
                    </div>
                </div>
            ),
        },
        {
            key: 'actions', header: t('common.actions'),
            render: (p: Person) => (
                <div style={{ display: 'flex', gap: '8px' }} onClick={e => e.stopPropagation()}>
                    <ThemedButton variant="secondary" onClick={() => crud.openEdit(p)}>{t('common.edit')}</ThemedButton>
                    <ThemedButton variant="danger" onClick={() => crud.openDeleteSingle(p)}>{t('common.delete')}</ThemedButton>
                </div>
            ),
        },
    ], [t, theme.colors.secondary, crud]);

    const secondaryActions = (
        <>
            <ThemedButton variant="secondary" onClick={crud.openCreate}>{t('admin.addPerson')}</ThemedButton>
            {crud.selectedRows.size > 0 && (
                <ThemedButton variant="danger" onClick={crud.handleDeleteSelected}>
                    {t('admin.deleteSelected', { count: crud.selectedRows.size })}
                </ThemedButton>
            )}
        </>
    );
    const headerActions = <AdminNavigation currentPage="persons" />;

    if (loading) return (
        <AppLayout breadcrumbs={breadcrumbs} headerActions={headerActions} secondaryActions={secondaryActions}>
            <div style={{ display: 'flex', justifyContent: 'center', padding: '48px' }}><ThemedLoadingSpinner size="sm" /></div>
        </AppLayout>
    );

    return (
        <AppLayout breadcrumbs={breadcrumbs} headerActions={headerActions} secondaryActions={secondaryActions}>
            <ThemedCard>

                <ThemedText size="small">{t('admin.personsSubtitle')}</ThemedText>
            </ThemedCard>
            {error && <ThemedCard variant="danger"><ThemedText variant="danger">{error}</ThemedText></ThemedCard>}
            <ThemedCard>
                <ThemedInput label={t('common.filter')} value={crud.filter} onChange={e => crud.setFilter(e.target.value)}
                    placeholder={t('admin.searchNameGenderDate')} variant="primary" />
                {crud.filter && <div style={{ marginTop: '8px', fontSize: '12px', color: theme.colors.secondary }}>
                    {t('admin.foundResults', { count: filteredPersons.length })}
                </div>}
            </ThemedCard>
            <ThemedCard>
                <ThemedTable data={filteredPersons} columns={columns} getRowId={p => p.id}
                    onRowClick={p => crud.openView(p)} selectedRows={crud.selectedRows} onRowSelect={crud.handleRowSelect} />
            </ThemedCard>
            <PersonModal isOpen={crud.modalState.isOpen} onClose={crud.closeModal}
                person={crud.modalState.entity} mode={crud.modalState.mode} onSubmit={crud.handleSubmit} />
            <ThemedConfirmDialog isOpen={crud.deleteDialog.isOpen} onClose={crud.closeDeleteDialog}
                onConfirm={crud.confirmDelete}
                title={crud.deleteDialog.isMultiple ? t('admin.deleteSelectedPersons') : t('admin.deletePerson')}
                message={crud.deleteDialog.isMultiple
                    ? t('admin.confirmDeleteSelected', { count: crud.selectedRows.size })
                    : t('admin.confirmDeletePerson', { name: `${crud.deleteDialog.entity?.first_name} ${crud.deleteDialog.entity?.last_name}` })}
                confirmText={t('common.delete')} variant="danger" isLoading={mutationLoading} />
        </AppLayout>
    );
};

export const PersonsCrudPage: React.FC = () => (
    <ThemeProvider defaultTheme={adminMainThemeId}><PersonsCrudPageContent /></ThemeProvider>
);
