import EditorFileUploader from '@/platform/functions/documents/editor/EditorFileUploader.tsx';
import EditorJoditComponent from '@/platform/functions/documents/editor/EditorJoditComponent.tsx';
import { ThemedButton } from '@/platform/core/layout/themes/components/ThemedButton.tsx';
import { ThemedCard } from '@/platform/core/layout/themes/components/ThemedCard.tsx';
import { ThemedLoadingOverlay } from '@/platform/core/layout/themes/components/ThemedLoadingOverlay.tsx';
import { ThemedLoadingSpinner } from '@/platform/core/layout/themes/components/ThemedLoadingSpinner.tsx';
import { ThemedSection } from '@/platform/core/layout/themes/components/ThemedSection.tsx';
import { ThemedText } from '@/platform/core/layout/themes/components/ThemedText.tsx';
import { AppLayout } from '@/platform/core/layout/AppLayout.tsx';
import { ThemeProvider, useTheme } from '@/platform/core/layout/themes/ThemeContext.tsx';
import {
  useProjectWithDocument,
  useProjectWithDocumentMutations,
} from '@/features/tribes-projects/projects/useProjects.ts';
import { useTribeWithPositions } from '@/features/tribes-projects/tribes/useTribesWithPositions.ts';
import {
  errorStyle,
  formActionsStyle,
  formContainerStyle,
  getInputStyle,
} from '@/platform/core/layout/themes/theme.styles.tsx';
import { AttachmentFile } from '@/platform/functions/documents/document.types.ts';
import { MenuAction } from '@/platform/core/layout/menu.types.ts';

import React, { useEffect, useMemo, useState } from 'react';
import { useTranslation } from 'react-i18next';
import { useNavigate, useParams } from 'react-router-dom';

const EditProjectPageContent: React.FC = () => {
  const { t } = useTranslation();
  const { theme } = useTheme();
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

  const [name, setName] = useState('');
  const [documentContent, setDocumentContent] = useState('');
  const [attachments, setAttachments] = useState<AttachmentFile[]>([]);
  const [error, setError] = useState<string | null>(null);
  const [submitting, setSubmitting] = useState(false);
  const [initialized, setInitialized] = useState(false);

  const inputStyle = getInputStyle(theme);

  useEffect(() => {
    if (project && !initialized) {
      setName(project.name);
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
    { label: t('projects.editProject') },
  ];

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!name.trim()) {
      setError(t('projects.name').replace(' *', '') + ' is required');
      return;
    }
    if (!projectId) return;
    setSubmitting(true);
    setError(null);
    try {
      const result = await updateProjectWithDocument(projectId, {
        name: name.trim(),
        document_content_html: documentContent,
        document_attachments: attachments,
      });
      if (!result) throw new Error('Failed to update project');
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
      {submitting && <ThemedLoadingOverlay message={t('projects.updating')} />}

      {error && (
        <div style={errorStyle}>
          <strong>{t('common.error')}</strong> {error}
        </div>
      )}

      <form onSubmit={handleSubmit}>
        <div style={formContainerStyle}>
          <ThemedSection themeId="main_1">
            <label>
              <ThemedText size="medium" as="h3">
                {t('projects.name')}
              </ThemedText>
              <input
                type="text"
                style={inputStyle}
                value={name}
                onChange={(e) => setName(e.target.value)}
                placeholder={t('projects.name').replace(' *', '')}
                disabled={submitting || loading}
              />
            </label>

            <ThemedText size="medium" as="h3" style={{ marginTop: '16px' }}>
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

export const EditProjectPage: React.FC = () => (
  <ThemeProvider defaultTheme="default">
    <EditProjectPageContent />
  </ThemeProvider>
);
