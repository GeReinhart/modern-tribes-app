import FileUploader from '@/components/common/editor/FileUploader';
import JoditEditorComponent from '@/components/common/editor/JoditEditorComponent';
import { ThemedButton } from '@/components/common/form/ThemedButton';
import { ThemedLoadingOverlay } from '@/components/common/layout/ThemedLoadingOverlay';
import { ThemedSection } from '@/components/common/layout/ThemedSection';
import { ThemedText } from '@/components/common/layout/ThemedText';
import { AppLayout } from '@/components/layout/AppLayout';
import { ThemeProvider, useTheme } from '@/contexts/ThemeContext';
import { useProjectWithDocumentMutations } from '@/hooks/useProjects';
import { useTribeWithPositions } from '@/hooks/useTribesWithPositions';
import {
  errorStyle,
  formActionsStyle,
  formContainerStyle,
  getInputStyle,
} from '@/styles/theme.styles';
import { AttachmentFile } from '@/types/document.types';
import { MenuAction } from '@/types/menu.types';

import React, { useMemo, useState } from 'react';
import { useTranslation } from 'react-i18next';
import { useNavigate, useParams } from 'react-router-dom';

const CreateProjectPageContent: React.FC = () => {
  const { t } = useTranslation();
  const { theme } = useTheme();
  const navigate = useNavigate();
  const { tribeId } = useParams<{ tribeId: string }>();

  const { tribe } = useTribeWithPositions(tribeId || null);
  const { createProjectWithDocument, loading } =
    useProjectWithDocumentMutations();

  const [name, setName] = useState('');
  const [documentContent, setDocumentContent] = useState('');
  const [attachments, setAttachments] = useState<AttachmentFile[]>([]);
  const [error, setError] = useState<string | null>(null);
  const [submitting, setSubmitting] = useState(false);

  const inputStyle = getInputStyle(theme);

  const breadcrumbs = [
    { label: t('common.home'), path: '/app' },
    { label: t('tribes.title'), path: '/app/tribes' },
    {
      label: tribe?.name || t('common.loading'),
      path: `/app/tribes/${tribeId}`,
    },
    { label: t('projects.addProject') },
  ];

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!name.trim()) {
      setError(t('projects.name').replace(' *', '') + ' is required');
      return;
    }
    if (!tribeId) return;
    setSubmitting(true);
    setError(null);
    try {
      const result = await createProjectWithDocument({
        tribe_id: tribeId,
        name: name.trim(),
        document_content_html: documentContent,
        document_attachments: attachments,
      });
      if (!result) throw new Error('Failed to create project');
      navigate(`/app/tribes/${tribeId}/projects/${result.url_param_id}`);
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
        onClick: () => navigate(`/app/tribes/${tribeId}`),
      },
    ],
    [t, navigate, tribeId],
  );

  return (
    <AppLayout breadcrumbs={breadcrumbs} menuActions={menuActions}>
      {submitting && <ThemedLoadingOverlay message={t('projects.creating')} />}

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
              <JoditEditorComponent
                content={documentContent}
                onChange={setDocumentContent}
              />
            </div>
            <div className="mb-6">
              <FileUploader
                attachments={attachments}
                onAttachmentsChange={setAttachments}
              />
            </div>
          </ThemedSection>

          <div style={formActionsStyle}>
            <ThemedButton
              variant="secondary"
              onClick={() => navigate(`/app/tribes/${tribeId}`)}
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
              {t('common.create')}
            </ThemedButton>
          </div>
        </div>
      </form>
    </AppLayout>
  );
};

export const CreateProjectPage: React.FC = () => (
  <ThemeProvider defaultTheme="default">
    <CreateProjectPageContent />
  </ThemeProvider>
);
