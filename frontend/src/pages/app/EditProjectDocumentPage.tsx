import EditorFileUploader from '@/platform/documents/editor/EditorFileUploader.tsx';
import EditorJoditComponent from '@/platform/documents/editor/EditorJoditComponent.tsx';
import { ThemedButton } from '@/platform/layout/themes/components/ThemedButton.tsx';
import { ThemedCard } from '@/platform/layout/themes/components/ThemedCard';
import { ThemedLoadingOverlay } from '@/platform/layout/themes/components/ThemedLoadingOverlay';
import { ThemedLoadingSpinner } from '@/platform/layout/themes/components/ThemedLoadingSpinner';
import { ThemedSection } from '@/platform/layout/themes/components/ThemedSection';
import { ThemedText } from '@/platform/layout/themes/components/ThemedText';
import { AppLayout } from '@/platform/layout/AppLayout';
import { ThemeProvider } from '@/platform/layout/themes/ThemeContext.tsx';
import {
  useProjectWithDocument,
  useProjectWithDocumentMutations,
} from '@/hooks/useProjects';
import { useTribeWithPositions } from '@/hooks/useTribesWithPositions';
import {
  errorStyle,
  formActionsStyle,
  formContainerStyle,
} from '@/platform/layout/themes/theme.styles.tsx';
import { AttachmentFile } from '@/types/document.types';
import { MenuAction } from '@/types/menu.types';

import React, { useEffect, useMemo, useState } from 'react';
import { useTranslation } from 'react-i18next';
import { useNavigate, useParams } from 'react-router-dom';

const EditProjectDocumentPageContent: React.FC = () => {
  const { t } = useTranslation();
  const navigate = useNavigate();
  const { tribeId, projectId } = useParams<{
    tribeId: string;
    projectId: string;
  }>();

  const { tribe } = useTribeWithPositions(tribeId || null);
  const { project, loading: loadingProject } = useProjectWithDocument(
    projectId || null,
  );
  const { updateProjectWithDocument, loading } =
    useProjectWithDocumentMutations();

  const [documentContent, setDocumentContent] = useState('');
  const [attachments, setAttachments] = useState<AttachmentFile[]>([]);
  const [error, setError] = useState<string | null>(null);
  const [submitting, setSubmitting] = useState(false);
  const [initialized, setInitialized] = useState(false);

  useEffect(() => {
    if (project && !initialized) {
      setDocumentContent(project.document_content_html);
      setAttachments(project.document_attachments);
      setInitialized(true);
    }
  }, [project, initialized]);

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
    { label: t('projects.editDocument') },
  ];

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!projectId) return;
    setSubmitting(true);
    setError(null);
    try {
      const result = await updateProjectWithDocument(projectId, {
        document_content_html: documentContent,
        document_attachments: attachments,
      });
      if (!result) throw new Error('Failed to update document');
      navigate(`/app/tribes/${tribeId}/projects/${projectId}`);
    } catch (err: unknown) {
      setError(err instanceof Error ? err.message : t('validation.errorOccurred'));
    } finally {
      setSubmitting(false);
    }
  };

  const menuActions = useMemo(
    (): MenuAction[] => [
      {
        icon: 'x',
        label: t('common.cancel'),
        onClick: () => navigate(`/app/tribes/${tribeId}/projects/${projectId}`),
      },
    ],
    [t, navigate, tribeId, projectId],
  );

  if (loadingProject) {
    return (
      <AppLayout breadcrumbs={breadcrumbs}>
        <ThemedLoadingSpinner />
      </AppLayout>
    );
  }

  if (!project) {
    return (
      <AppLayout breadcrumbs={breadcrumbs}>
        <ThemedCard>
          <div style={errorStyle}>
            <strong>{t('common.error')}</strong> {t('projects.notFound')}
          </div>
        </ThemedCard>
      </AppLayout>
    );
  }

  return (
    <AppLayout breadcrumbs={breadcrumbs} menuActions={menuActions}>
      {submitting && (
        <ThemedLoadingOverlay message={t('projects.updatingDocument')} />
      )}

      {error && (
        <div style={errorStyle}>
          <strong>{t('common.error')}</strong> {error}
        </div>
      )}

      <form onSubmit={handleSubmit}>
        <div style={formContainerStyle}>
          <ThemedSection themeId="main_1">
            <ThemedText size="medium" as="h3">
              {t('projects.description')}
            </ThemedText>
            <div className="border border-gray-300 rounded-lg overflow-hidden">
              <EditorJoditComponent
                content={documentContent}
                onChange={setDocumentContent}
              />
            </div>
            <div className="mb-6">
              <EditorFileUploader
                attachments={attachments}
                onAttachmentsChange={setAttachments}
              />
            </div>
          </ThemedSection>

          <div style={formActionsStyle}>
            <ThemedButton
              variant="secondary"
              onClick={() =>
                navigate(`/app/tribes/${tribeId}/projects/${projectId}`)
              }
              disabled={submitting}
            >
              {t('common.cancel')}
            </ThemedButton>
            <ThemedButton
              type="submit"
              variant="primary"
              isLoading={submitting || loading}
              disabled={submitting || loading}
            >
              {t('common.update')}
            </ThemedButton>
          </div>
        </div>
      </form>
    </AppLayout>
  );
};

export const EditProjectDocumentPage: React.FC = () => (
  <ThemeProvider defaultTheme="default">
    <EditProjectDocumentPageContent />
  </ThemeProvider>
);
