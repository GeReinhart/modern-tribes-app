import EditorFileUploader from '@/platform/functions/documents/editor/EditorFileUploader.tsx';
import EditorJoditComponent from '@/platform/functions/documents/editor/EditorJoditComponent.tsx';
import { ThemedButton } from '@/platform/core/layout/themes/components/ThemedButton.tsx';
import { ThemedSvgIcon } from '@/platform/core/layout/themes/icons/ThemedSvgIcon.tsx';
import { ThemedCard } from '@/platform/core/layout/themes/components/ThemedCard.tsx';
import { ThemedLoadingOverlay } from '@/platform/core/layout/themes/components/ThemedLoadingOverlay.tsx';
import { ThemedLoadingSpinner } from '@/platform/core/layout/themes/components/ThemedLoadingSpinner.tsx';
import { ThemedSection } from '@/platform/core/layout/themes/components/ThemedSection.tsx';
import { ThemedText } from '@/platform/core/layout/themes/components/ThemedText.tsx';
import { AppLayout } from '@/platform/core/layout/AppLayout.tsx';
import { ThemeProvider, useTheme } from '@/platform/core/layout/themes/ThemeContext.tsx';
import { useDocumentPage } from '@/platform/functions/documents/useDocumentPages.ts';
import { useProjectWithDocument } from '@/features/tribes-projects/projects/useProjects.ts';
import { useTribeWithPositions } from '@/features/tribes-projects/tribes/useTribesWithPositions.ts';
import { documentPageService } from '@/platform/functions/documents/document-page.service.ts';
import {
  errorStyle,
  formActionsStyle,
  formContainerStyle,
} from '@/platform/core/layout/themes/theme.styles.tsx';
import { AttachmentFile } from '@/platform/functions/documents/document.types.ts';
import { MenuAction } from '@/platform/core/layout/menu.types.ts';

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
              leftIcon={
                <ThemedSvgIcon name="x" color="currentColor" size={16} />
              }
            >
              {t('common.cancel')}
            </ThemedButton>
            <ThemedButton
              type="submit"
              variant="primary"
              isLoading={submitting}
              disabled={submitting || !title.trim()}
              leftIcon={
                <ThemedSvgIcon name="save" color="currentColor" size={16} />
              }
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
