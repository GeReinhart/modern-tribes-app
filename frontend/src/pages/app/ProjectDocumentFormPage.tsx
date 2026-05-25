import FileUploader from '@/components/common/editor/FileUploader';
import JoditEditorComponent from '@/components/common/editor/JoditEditorComponent';
import { LabelSelector } from '@/components/common/form/LabelSelector';
import { ThemedButton } from '@/components/common/form/ThemedButton';
import { ThemedCard } from '@/components/common/layout/ThemedCard';
import { ThemedLoadingOverlay } from '@/components/common/layout/ThemedLoadingOverlay';
import { ThemedLoadingSpinner } from '@/components/common/layout/ThemedLoadingSpinner';
import { ThemedSection } from '@/components/common/layout/ThemedSection';
import { ThemedText } from '@/components/common/layout/ThemedText';
import { AppLayout } from '@/components/layout/AppLayout';
import { ThemeProvider, useTheme } from '@/contexts/ThemeContext';
import { useProjectDocument } from '@/hooks/useProjectDocuments';
import { useProjectWithDocument } from '@/hooks/useProjects';
import { useTribeWithPositions } from '@/hooks/useTribesWithPositions';
import { labelService } from '@/services/label.service';
import { projectDocumentService } from '@/services/project-document.service';
import {
  errorStyle,
  formActionsStyle,
  formContainerStyle,
} from '@/styles/theme.styles';
import { AttachmentFile } from '@/types/document.types';
import { MenuAction } from '@/types/menu.types';

import React, { useEffect, useMemo, useState } from 'react';
import { useTranslation } from 'react-i18next';
import { useNavigate, useParams } from 'react-router-dom';

const ProjectDocumentFormPageContent: React.FC = () => {
  const { t } = useTranslation();
  const { theme } = useTheme();
  const navigate = useNavigate();
  const { tribeId, projectId, projectDocumentId } = useParams<{
    tribeId: string;
    projectId: string;
    projectDocumentId?: string;
  }>();

  const isEdit = !!projectDocumentId;

  const { tribe } = useTribeWithPositions(tribeId || null);
  const { project } = useProjectWithDocument(projectId || null);
  const { document: existingDoc, loading: loadingDoc } = useProjectDocument(
    isEdit ? projectId || null : null,
    isEdit ? projectDocumentId || null : null,
  );

  const [title, setTitle] = useState('');
  const [content, setContent] = useState('');
  const [attachments, setAttachments] = useState<AttachmentFile[]>([]);
  const [labelNames, setLabelNames] = useState<string[]>([]);
  const [tocDepth, setTocDepth] = useState<number>(4);
  const [allLabelSuggestions, setAllLabelSuggestions] = useState<string[]>([]);
  const [initialized, setInitialized] = useState(false);
  const [submitting, setSubmitting] = useState(false);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    labelService
      .getAll()
      .then((labels) => {
        setAllLabelSuggestions(labels.map((l) => l.name));
      })
      .catch(() => {});
  }, []);

  useEffect(() => {
    if (isEdit && existingDoc && !initialized) {
      setTitle(existingDoc.title);
      setContent(existingDoc.content_html);
      setAttachments(existingDoc.attachments);
      setLabelNames(existingDoc.labels.map((l) => l.name));
      setTocDepth(existingDoc.toc_depth ?? 4);
      setInitialized(true);
    }
    if (!isEdit && !initialized) {
      setInitialized(true);
    }
  }, [isEdit, existingDoc, initialized]);

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
        ? existingDoc?.title || t('common.loading')
        : t('projectDocuments.newDocument'),
    },
  ];

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!projectId) return;
    if (!title.trim()) {
      setError(t('projectDocuments.titleRequired'));
      return;
    }
    setSubmitting(true);
    setError(null);
    try {
      if (isEdit && projectDocumentId) {
        await projectDocumentService.update(projectId, projectDocumentId, {
          title: title.trim(),
          content_html: content,
          attachments,
          label_names: labelNames,
          toc_depth: tocDepth,
        });
        navigate(
          `/app/tribes/${tribeId}/projects/${projectId}/documents/${projectDocumentId}`,
        );
      } else {
        const created = await projectDocumentService.create(projectId, {
          title: title.trim(),
          content_html: content,
          attachments,
          label_names: labelNames,
          toc_depth: tocDepth,
        });
        navigate(
          `/app/tribes/${tribeId}/projects/${projectId}/documents/${created.url_param_id}`,
        );
      }
    } catch (err: unknown) {
      setError(err instanceof Error ? err.message : t('validation.errorOccurred'));
    } finally {
      setSubmitting(false);
    }
  };

  const cancelPath =
    isEdit && projectDocumentId
      ? `/app/tribes/${tribeId}/projects/${projectId}/documents/${projectDocumentId}`
      : `/app/tribes/${tribeId}/projects/${projectId}`;

  const menuActions = useMemo(
    (): MenuAction[] => [
      {
        icon: 'x',
        label: t('common.cancel'),
        onClick: () => navigate(cancelPath),
      },
    ],
    [t, navigate, cancelPath],
  );

  if (isEdit && loadingDoc) {
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

  if (isEdit && !loadingDoc && !existingDoc) {
    return (
      <AppLayout breadcrumbs={breadcrumbs}>
        <ThemedCard>
          <div style={errorStyle}>
            <strong>{t('common.error')}</strong>{' '}
            {t('projectDocuments.notFound')}
          </div>
        </ThemedCard>
      </AppLayout>
    );
  }

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

  return (
    <AppLayout breadcrumbs={breadcrumbs} menuActions={menuActions}>
      {submitting && (
        <ThemedLoadingOverlay
          message={
            isEdit
              ? t('projectDocuments.updating')
              : t('projectDocuments.creating')
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
                {t('projectDocuments.title')} *
              </label>
              <input
                type="text"
                value={title}
                onChange={(e) => setTitle(e.target.value)}
                placeholder={t('projectDocuments.titlePlaceholder')}
                style={inputStyle}
                required
                autoFocus
              />
            </div>

            <div style={{ marginBottom: '16px' }}>
              <LabelSelector
                label={t('projectDocuments.labels')}
                value={labelNames}
                onChange={setLabelNames}
                suggestions={allLabelSuggestions}
                placeholder={t('projectDocuments.labelsPlaceholder')}
              />
            </div>

            <div style={{ marginBottom: '16px' }}>
              <ThemedText
                size="small"
                variant="secondary"
                style={{ marginBottom: '8px' }}
              >
                {t('projectDocuments.tocDepthLabel')}
              </ThemedText>
              <div style={{ display: 'flex', gap: '6px' }}>
                {([1, 2, 3, 4] as const).map((d) => (
                  <button
                    key={d}
                    type="button"
                    onClick={() => setTocDepth(d)}
                    style={{
                      padding: '4px 12px',
                      borderRadius: '6px',
                      border: `1px solid ${tocDepth === d ? theme.colors.primary : theme.colors.border}`,
                      backgroundColor:
                        tocDepth === d
                          ? theme.colors.primary
                          : theme.colors.surface,
                      color: tocDepth === d ? '#fff' : theme.colors.secondary,
                      cursor: 'pointer',
                      fontSize: 'var(--font-sm)',
                      fontWeight: tocDepth === d ? 600 : 400,
                    }}
                  >
                    H{d}
                  </button>
                ))}
              </div>
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
                <JoditEditorComponent content={content} onChange={setContent} />
              </div>
            </div>

            <div>
              <FileUploader
                attachments={attachments}
                onAttachmentsChange={setAttachments}
              />
            </div>
          </ThemedSection>

          <div style={formActionsStyle}>
            <ThemedButton
              variant="secondary"
              onClick={() => navigate(cancelPath)}
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

export const ProjectDocumentFormPage: React.FC = () => (
  <ThemeProvider defaultTheme="default">
    <ProjectDocumentFormPageContent />
  </ThemeProvider>
);
