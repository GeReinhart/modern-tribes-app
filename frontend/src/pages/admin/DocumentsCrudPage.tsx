import { ThemedButton } from '@/platform/themes/components/ThemedButton.tsx';
import { ThemedInput } from '@/platform/themes/components/ThemedInput.tsx';
import { StatusBadge } from '@/platform/themes/components/StatusBadge.tsx';
import { ThemedCard } from '@/platform/themes/components/ThemedCard';
import { ThemedConfirmDialog } from '@/platform/themes/components/ThemedConfirmDialog.tsx';
import { ThemedLoadingSpinner } from '@/platform/themes/components/ThemedLoadingSpinner.tsx';
import { ThemedTable } from '@/platform/themes/components/ThemedTable.tsx';
import { ThemedText } from '@/platform/themes/components/ThemedText';
import { DocumentModal } from '@/platform/documents/DocumentModal.tsx';
import {
  AdminNavigation,
  adminMainThemeId,
} from '@/components/layout/AdminNavigation';
import { AppLayout } from '@/components/layout/AppLayout';
import { ThemeProvider, useTheme } from '@/platform/themes/ThemeContext.tsx';
import { useCrudPage } from '@/hooks/useCrudPage';
import { useDocumentMutations, useDocuments } from '@/hooks/useDocuments';
import {
  Document,
  DocumentCreate,
  DocumentUpdate,
} from '@/types/document.types';

import React, { useMemo } from 'react';
import { useTranslation } from 'react-i18next';

const stripHtml = (html: string) => {
  const tmp = window.document.createElement('DIV');
  tmp.innerHTML = html;
  return tmp.textContent || tmp.innerText || '';
};

const DocumentsCrudPageContent: React.FC = () => {
  const { t } = useTranslation();
  const { theme } = useTheme();
  const { documents, loading, error, refetch } = useDocuments();
  const {
    createDocument,
    updateDocument,
    deleteDocument,
    loading: mutationLoading,
  } = useDocumentMutations();
  const crud = useCrudPage<Document, DocumentCreate, DocumentUpdate>(
    refetch,
    createDocument,
    updateDocument,
    deleteDocument,
  );

  const breadcrumbs = useMemo(
    () => [
      { label: t('common.home'), path: '/app' },
      { label: t('common.admin'), path: '/admin' },
      { label: t('admin.documents') },
    ],
    [t],
  );

  const filteredDocuments = useMemo(() => {
    if (!crud.filter.trim()) return documents;
    const term = crud.filter.toLowerCase();
    return documents.filter((d) =>
      stripHtml(d.content_summary || '')
        .toLowerCase()
        .includes(term),
    );
  }, [documents, crud.filter]);

  const columns = useMemo(
    () => [
      {
        key: 'content',
        header: t('admin.columnContentSummary'),
        render: (d: Document) => (
          <div style={{ maxWidth: '400px' }}>
            <div
              style={{
                fontSize: '12px',
                color: theme.colors.text,
                overflow: 'hidden',
                textOverflow: 'ellipsis',
                whiteSpace: 'nowrap',
              }}
            >
              {stripHtml(d.content_summary || '').substring(0, 100)}...
            </div>
          </div>
        ),
      },
      {
        key: 'attachments',
        header: t('admin.columnAttachments'),
        render: (d: Document) => (
          <span style={{ fontSize: '12px', color: theme.colors.secondary }}>
            {t('admin.files', { count: d.attachments?.length || 0 })}
          </span>
        ),
      },
      {
        key: 'created_at',
        header: t('common.created'),
        render: (d: Document) => new Date(d.created_at).toLocaleDateString(),
      },
      {
        key: 'status',
        header: t('monitoring.status'),
        render: (d: Document) => <StatusBadge status={d.status ?? 'active'} />,
      },
      {
        key: 'actions',
        header: t('common.actions'),
        render: (d: Document) => (
          <div
            style={{ display: 'flex', gap: '8px' }}
            onClick={(e) => e.stopPropagation()}
          >
            <ThemedButton variant="secondary" onClick={() => crud.openEdit(d)}>
              {t('common.edit')}
            </ThemedButton>
            <ThemedButton
              variant="danger"
              onClick={() => crud.openDeleteSingle(d)}
            >
              {t('common.delete')}
            </ThemedButton>
          </div>
        ),
      },
    ],
    [t, theme.colors.text, theme.colors.secondary, crud],
  );

  const secondaryActions = (
    <>
      <ThemedButton variant="secondary" onClick={crud.openCreate}>
        {t('admin.addDocument')}
      </ThemedButton>
      {crud.selectedRows.size > 0 && (
        <ThemedButton variant="danger" onClick={crud.handleDeleteSelected}>
          {t('admin.deleteSelected', { count: crud.selectedRows.size })}
        </ThemedButton>
      )}
    </>
  );
  const headerActions = <AdminNavigation currentPage="documents" />;

  if (loading)
    return (
      <AppLayout
        breadcrumbs={breadcrumbs}
        headerActions={headerActions}
        secondaryActions={secondaryActions}
      >
        <div
          style={{ display: 'flex', justifyContent: 'center', padding: '48px' }}
        >
          <ThemedLoadingSpinner variant="primary" />
        </div>
      </AppLayout>
    );

  return (
    <AppLayout
      breadcrumbs={breadcrumbs}
      headerActions={headerActions}
      secondaryActions={secondaryActions}
    >
      <ThemedCard>
        <ThemedText size="small">{t('admin.documentsSubtitle')}</ThemedText>
      </ThemedCard>
      {error && (
        <ThemedCard variant="danger">
          <ThemedText variant="danger">{error}</ThemedText>
        </ThemedCard>
      )}
      <ThemedCard>
        <ThemedInput
          label={t('common.filter')}
          value={crud.filter}
          onChange={(e) => crud.setFilter(e.target.value)}
          placeholder={t('admin.searchContent')}
          variant="primary"
        />
      </ThemedCard>
      <ThemedCard>
        <ThemedTable
          data={filteredDocuments}
          columns={columns}
          getRowId={(d) => d.id}
          onRowClick={(d) => crud.openView(d)}
          selectedRows={crud.selectedRows}
          onRowSelect={crud.handleRowSelect}
        />
      </ThemedCard>
      <DocumentModal
        isOpen={crud.modalState.isOpen}
        onClose={crud.closeModal}
        document={crud.modalState.entity}
        mode={crud.modalState.mode}
        onSubmit={crud.handleSubmit}
      />
      <ThemedConfirmDialog
        isOpen={crud.deleteDialog.isOpen}
        onClose={crud.closeDeleteDialog}
        onConfirm={crud.confirmDelete}
        title={
          crud.deleteDialog.isMultiple
            ? t('admin.deleteSelectedDocuments')
            : t('admin.deleteDocument')
        }
        message={
          crud.deleteDialog.isMultiple
            ? t('admin.confirmDeleteSelected', {
                count: crud.selectedRows.size,
              })
            : t('admin.confirmDeleteDocument')
        }
        confirmText={t('common.delete')}
        variant="danger"
        isLoading={mutationLoading}
      />
    </AppLayout>
  );
};

export const DocumentsCrudPage: React.FC = () => (
  <ThemeProvider defaultTheme={adminMainThemeId}>
    <DocumentsCrudPageContent />
  </ThemeProvider>
);
