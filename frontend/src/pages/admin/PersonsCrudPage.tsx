import React, { useMemo } from 'react';
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

const GENDER_LABELS: Record<string, string> = { male: 'Male', female: 'Female', other: 'Other', prefer_not_to_say: 'Prefer not to say' };
const getGenderLabel = (gender: string) => GENDER_LABELS[gender] || gender;

const breadcrumbs = [{ label: 'Home', path: '/app' }, { label: 'Admin', path: '/admin' }, { label: 'Persons' }];

const PersonsCrudPageContent: React.FC = () => {
    const { theme } = useTheme();
    const { persons, loading, error, refetch } = usePersons();
    const { createPerson, updatePerson, deletePerson, loading: mutationLoading } = usePersonMutations();
    const crud = useCrudPage<Person, PersonCreate, PersonUpdate>(refetch, createPerson, updatePerson, deletePerson);

    const filteredPersons = useMemo(() => {
        if (!crud.filter.trim()) return persons;
        const term = crud.filter.toLowerCase();
        return persons.filter(p => [
            p.first_name, p.last_name, `${p.first_name} ${p.last_name}`,
            p.gender, getGenderLabel(p.gender), p.id,
            new Date(p.created_at).toLocaleDateString(),
        ].join(' ').toLowerCase().includes(term));
    }, [persons, crud.filter]);

    const columns = [
        {
            key: 'name', header: 'Name',
            render: (p: Person) => (
                <div>
                    <div style={{ fontWeight: 500 }}>{p.first_name} {p.last_name}</div>
                    <div style={{ fontSize: '12px', color: theme.colors.secondary }}>{getGenderLabel(p.gender)}</div>
                </div>
            ),
        },
        {
            key: 'created_at', header: 'Created',
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
            key: 'actions', header: 'Actions',
            render: (p: Person) => (
                <div style={{ display: 'flex', gap: '8px' }} onClick={e => e.stopPropagation()}>
                    <ThemedButton variant="secondary" onClick={() => crud.openEdit(p)}>Edit</ThemedButton>
                    <ThemedButton variant="danger" onClick={() => crud.openDeleteSingle(p)}>Delete</ThemedButton>
                </div>
            ),
        },
    ];

    const secondaryActions = (
        <>
            <ThemedButton variant="secondary" onClick={crud.openCreate}>Add Person</ThemedButton>
            {crud.selectedRows.size > 0 && (
                <ThemedButton variant="danger" onClick={crud.handleDeleteSelected}>
                    Delete Selected ({crud.selectedRows.size})
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
                <ThemedText variant="primary" size="large" as="h1">Persons</ThemedText>
                <ThemedText size="small">Manage persons</ThemedText>
            </ThemedCard>
            {error && <ThemedCard variant="danger"><ThemedText variant="danger">{error}</ThemedText></ThemedCard>}
            <ThemedCard>
                <ThemedInput label="Filter" value={crud.filter} onChange={e => crud.setFilter(e.target.value)}
                    placeholder="Search by name, gender, date..." variant="primary" />
                {crud.filter && <div style={{ marginTop: '8px', fontSize: '12px', color: theme.colors.secondary }}>
                    Found {filteredPersons.length} result{filteredPersons.length !== 1 ? 's' : ''}
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
                title={crud.deleteDialog.isMultiple ? 'Delete Selected Persons' : 'Delete Person'}
                message={crud.deleteDialog.isMultiple
                    ? `Are you sure you want to delete ${crud.selectedRows.size} person(s)?`
                    : `Are you sure you want to delete ${crud.deleteDialog.entity?.first_name} ${crud.deleteDialog.entity?.last_name}?`}
                confirmText="Delete" variant="danger" isLoading={mutationLoading} />
        </AppLayout>
    );
};

export const PersonsCrudPage: React.FC = () => (
    <ThemeProvider defaultTheme={adminMainThemeId}><PersonsCrudPageContent /></ThemeProvider>
);
