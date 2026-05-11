import React, { useMemo } from 'react';
import { ThemeProvider, useTheme } from '@/contexts/ThemeContext';
import { AppLayout } from '@/components/layout/AppLayout';
import { adminMainThemeId, AdminNavigation } from '@/components/layout/AdminNavigation';
import { useDocuments, useDocumentMutations } from '@/hooks/useDocuments';
import { Document, DocumentCreate, DocumentUpdate } from '@/types/document.types';
import { DocumentModal } from '@/components/entities/documents/DocumentModal';
import { ThemedCard } from '@/components/common/layout/ThemedCard';
import { ThemedText } from '@/components/common/layout/ThemedText';
import { ThemedButton } from '@/components/common/form/ThemedButton';
import { ThemedTable } from '@/components/common/layout/ThemedTable.tsx';
import { ThemedInput } from '@/components/common/form/ThemedInput.tsx';
import { ThemedConfirmDialog } from '@/components/common/layout/ThemedConfirmDialog.tsx';
import { ThemedLoadingSpinner } from '@/components/common/layout/ThemedLoadingSpinner.tsx';
import { useCrudPage } from '@/hooks/useCrudPage';

const breadcrumbs = [{ label: 'Home', path: '/app' }, { label: 'Admin', path: '/admin' }, { label: 'Documents' }];

const stripHtml = (html: string) => {
    const tmp = window.document.createElement('DIV');
    tmp.innerHTML = html;
    return tmp.textContent || tmp.innerText || '';
};

const DocumentsCrudPageContent: React.FC = () => {
    const { theme } = useTheme();
    const { documents, loading, error, refetch } = useDocuments();
    const { createDocument, updateDocument, deleteDocument, loading: mutationLoading } = useDocumentMutations();
    const crud = useCrudPage<Document, DocumentCreate, DocumentUpdate>(refetch, createDocument, updateDocument, deleteDocument);

    const filteredDocuments = useMemo(() => {
        if (!crud.filter.trim()) return documents;
        const term = crud.filter.toLowerCase();
        return documents.filter(d => stripHtml(d.content_summary || '').toLowerCase().includes(term));
    }, [documents, crud.filter]);

    const columns = [
        {
            key: 'content', header: 'Content summary',
            render: (d: Document) => (
                <div style={{ maxWidth: '400px' }}>
                    <div style={{ fontSize: '12px', color: theme.colors.text, overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>
                        {stripHtml(d.content_summary || '').substring(0, 100)}...
                    </div>
                </div>
            ),
        },
        {
            key: 'attachments', header: 'Attachments',
            render: (d: Document) => <span style={{ fontSize: '12px', color: theme.colors.secondary }}>{d.attachments?.length || 0} file(s)</span>,
        },
        { key: 'created_at', header: 'Created', render: (d: Document) => new Date(d.created_at).toLocaleDateString() },
        {
            key: 'actions', header: 'Actions',
            render: (d: Document) => (
                <div style={{ display: 'flex', gap: '8px' }} onClick={e => e.stopPropagation()}>
                    <ThemedButton variant="secondary" onClick={() => crud.openEdit(d)}>Edit</ThemedButton>
                    <ThemedButton variant="danger" onClick={() => crud.openDeleteSingle(d)}>Delete</ThemedButton>
                </div>
            ),
        },
    ];

    const secondaryActions = (
        <>
            <ThemedButton variant="secondary" onClick={crud.openCreate}>Add Document</ThemedButton>
            {crud.selectedRows.size > 0 && (
                <ThemedButton variant="danger" onClick={crud.handleDeleteSelected}>
                    Delete Selected ({crud.selectedRows.size})
                </ThemedButton>
            )}
        </>
    );
    const headerActions = <AdminNavigation currentPage="documents" />;

    if (loading) return (
        <AppLayout breadcrumbs={breadcrumbs} headerActions={headerActions} secondaryActions={secondaryActions}>
            <div style={{ display: 'flex', justifyContent: 'center', padding: '48px' }}><ThemedLoadingSpinner variant="primary" /></div>
        </AppLayout>
    );

    return (
        <AppLayout breadcrumbs={breadcrumbs} headerActions={headerActions} secondaryActions={secondaryActions}>
            <ThemedCard>
                <ThemedText variant="primary" size="large" as="h1">Documents</ThemedText>
                <ThemedText size="small">Manage documents and content</ThemedText>
            </ThemedCard>
            {error && <ThemedCard variant="danger"><ThemedText variant="danger">{error}</ThemedText></ThemedCard>}
            <ThemedCard>
                <ThemedInput label="Filter" value={crud.filter} onChange={e => crud.setFilter(e.target.value)}
                    placeholder="Search by content..." variant="primary" />
            </ThemedCard>
            <ThemedCard>
                <ThemedTable data={filteredDocuments} columns={columns} getRowId={d => d.id}
                    onRowClick={d => crud.openView(d)} selectedRows={crud.selectedRows} onRowSelect={crud.handleRowSelect} />
            </ThemedCard>
            <DocumentModal isOpen={crud.modalState.isOpen} onClose={crud.closeModal}
                document={crud.modalState.entity} mode={crud.modalState.mode} onSubmit={crud.handleSubmit} />
            <ThemedConfirmDialog isOpen={crud.deleteDialog.isOpen} onClose={crud.closeDeleteDialog}
                onConfirm={crud.confirmDelete}
                title={crud.deleteDialog.isMultiple ? 'Delete Selected Documents' : 'Delete Document'}
                message={crud.deleteDialog.isMultiple
                    ? `Are you sure you want to delete ${crud.selectedRows.size} document(s)?`
                    : 'Are you sure you want to delete this document?'}
                confirmText="Delete" variant="danger" isLoading={mutationLoading} />
        </AppLayout>
    );
};

export const DocumentsCrudPage: React.FC = () => (
    <ThemeProvider defaultTheme={adminMainThemeId}><DocumentsCrudPageContent /></ThemeProvider>
);
