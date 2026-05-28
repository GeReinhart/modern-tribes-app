import EditorFileUploader from '@/platform/documents/editor/EditorFileUploader.tsx';
import EditorJoditComponent from '@/platform/documents/editor/EditorJoditComponent.tsx';
import { ThemedButton } from '@/platform/themes/components/ThemedButton.tsx';
import { ThemedCard } from '@/platform/themes/components/ThemedCard';
import { ThemedLoadingOverlay } from '@/platform/themes/components/ThemedLoadingOverlay';
import { ThemedLoadingSpinner } from '@/platform/themes/components/ThemedLoadingSpinner';
import { ThemedSection } from '@/platform/themes/components/ThemedSection';
import { ThemedText } from '@/platform/themes/components/ThemedText';
import { AppLayout } from '@/components/layout/AppLayout';
import { ThemeProvider, useTheme } from '@/platform/themes/ThemeContext.tsx';
import { useDocumentPage } from '@/hooks/useDocumentPages';
import { useProjectWithDocument } from '@/hooks/useProjects';
import { useTribeWithPositions } from '@/hooks/useTribesWithPositions';
import { documentPageService } from '@/services/document-page.service';
import {
  errorStyle,
  formActionsStyle,
  formContainerStyle,
} from '@/platform/themes/theme.styles.tsx';
import { AttachmentFile } from '@/types/document.types';
import { MenuAction } from '@/types/menu.types';

import React, { useEffect, useMemo, useState } from 'react';
import { useTranslation } from 'react-i18next';
import { useNavigate, useParams } from 'react-router-dom';

const DocumentPageFormPageContent: React.FC = () => {
  const { t } = useTranslation();
  const { theme } = useTheme();
  const navigate = useNavigate();
  const { tribeId, projectId, projectDocumentId, pageId } = useParams<{
    tribeId: string;
    projectId: string;
    projectDocumentId: string;
    pageId?: string;
  }>();

  const isEdit = !!pageId;

  const { tribe } = useTribeWithPositions(tribeId || null);
  const { project } = useProjectWithDocument(projectId || null);
  const { page: existingPage, loading: loadingPage } = useDocumentPage(
    isEdit ? projectId || null : null,
    isEdit ? projectDocumentId || null : null,
    isEdit ? pageId || null : null,
  );

  const [title, setTitle] = useState('');
  const [content, setContent] = useState('');
  const [attachments, setAttachments] = useState<AttachmentFile[]>([]);
  const [initialized, setInitialized] = useState(false);
  const [submitting, setSubmitting] = useState(false);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    if (isEdit && existingPage && !initialized) {
      setTitle(existingPage.title);
      setContent(existingPage.content_html);
      setAttachments(existingPage.attachments);
      setInitialized(true);
    }
    if (!isEdit && !initialized) {
      setInitialized(true);
    }
  }, [isEdit, existingPage, initialized]);

  const docPath = `/app/tribes/${tribeId}/projects/${projectId}/documents/${projectDocumentId}`;

  const breadcrumbs = [
    { label: t('common.home'), path: '/app' },
    { label: t('tribes.title'), path: '/app/tribes' },
    {
      label: tribe?.name || t('common.loading'),
      path: `/app/tribes/${tribeId}`,
    },
    {
      label: project?.name || t('common.loading'),
      path: `/app/tribes/${tribeId}/projects/${projectId}`,
    },
    {
      label: isEdit
        ? existingPage?.title || t('common.loading')
        : t('documentPages.newPage'),
    },
  ];

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!projectId || !projectDocumentId) return;
    if (!title.trim()) {
      setError(t('documentPages.titleRequired'));
      return;
    }
    setSubmitting(true);
    setError(null);
    try {
      if (isEdit && pageId) {
        await documentPageService.update(projectId, projectDocumentId, pageId, {
          title: title.trim(),
          content_html: content,
          attachments,
        });
        navigate(docPath);
      } else {
        await documentPageService.create(projectId, projectDocumentId, {
          title: title.trim(),
          content_html: content,
          attachments,
        });
        navigate(docPath);
      }
    } catch (err: unknown) {
      const msg =
        err instanceof Error ? err.message : t('validation.errorOccurred');
      setError(msg);
    } finally {
      setSubmitting(false);
    }
  };

  const menuActions = useMemo(
    (): MenuAction[] => [
      {
        icon: 'x',
        label: t('common.cancel'),
        onClick: () => navigate(docPath),
      },
    ],
    [t, navigate, docPath],
  );

  const inputStyle: React.CSSProperties = {
    width: '100%',
    padding: '8px 12px',
    border: `1px solid ${theme.colors.border}`,
    borderRadius: '8px',
    backgroundColor: theme.colors.surface,
    color: theme.colors.text,
    fontSize: 'var(--font-sm)',
    boxSizing: 'border-box',
    outline: 'none',
  };

  if (isEdit && loadingPage) {
    return (
      <AppLayout breadcrumbs={breadcrumbs}>
        <div
          style={{ display: 'flex', justifyContent: 'center', padding: '48px' }}
        >
          <ThemedLoadingSpinner size="sm" />
        </div>
      </AppLayout>
    );
  }

  if (isEdit && !loadingPage && !existingPage) {
    return (
      <AppLayout breadcrumbs={breadcrumbs}>
        <ThemedCard>
          <div style={errorStyle}>
            <strong>{t('common.error')}</strong> {t('documentPages.notFound')}
          </div>
        </ThemedCard>
      </AppLayout>
    );
  }

  return (
    <AppLayout breadcrumbs={breadcrumbs} menuActions={menuActions}>
      {submitting && (
        <ThemedLoadingOverlay
          message={
            isEdit ? t('documentPages.updating') : t('documentPages.creating')
          }
        />
      )}
      {error && (
        <div style={errorStyle}>
          <strong>{t('common.error')}</strong> {error}
        </div>
      )}
      <form onSubmit={handleSubmit}>
        <div style={formContainerStyle}>
          <ThemedSection themeId="main_1">
            <div style={{ marginBottom: '16px' }}>
              <label
                style={{
                  display: 'block',
                  fontSize: 'var(--font-sm)',
                  fontWeight: 500,
                  color: theme.colors.secondary,
                  marginBottom: '6px',
                }}
              >
                {t('documentPages.title')} *
              </label>
              <input
                type="text"
                value={title}
                onChange={(e) => setTitle(e.target.value)}
                placeholder={t('documentPages.titlePlaceholder')}
                style={inputStyle}
                required
                autoFocus
              />
            </div>
            <div style={{ marginBottom: '16px' }}>
              <ThemedText
                size="small"
                variant="secondary"
                style={{ marginBottom: '8px' }}
              >
                {t('projects.description')}
              </ThemedText>
              <div className="border border-gray-300 rounded-lg overflow-hidden">
                <EditorJoditComponent content={content} onChange={setContent} />
              </div>
            </div>
            <div>
              <EditorFileUploader
                attachments={attachments}
                onAttachmentsChange={setAttachments}
              />
            </div>
          </ThemedSection>
          <div style={formActionsStyle}>
            <ThemedButton
              variant="secondary"
              onClick={() => navigate(docPath)}
              disabled={submitting}
            >
              {t('common.cancel')}
            </ThemedButton>
            <ThemedButton
              type="submit"
              variant="primary"
              isLoading={submitting}
              disabled={submitting || !title.trim()}
            >
              {isEdit ? t('common.update') : t('common.create')}
            </ThemedButton>
          </div>
        </div>
      </form>
    </AppLayout>
  );
};

export const DocumentPageFormPage: React.FC = () => (
  <ThemeProvider defaultTheme="default">
    <DocumentPageFormPageContent />
  </ThemeProvider>
);
