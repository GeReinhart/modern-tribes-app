import { ThemedButton } from '@/components/common/form/ThemedButton';
import { DocumentFormPagesEditor } from '@/platform/documents/DocumentFormPagesEditor.tsx';
import { ThemedCard } from '@/platform/themes/layout/ThemedCard';
import { ThemedLoadingOverlay } from '@/platform/themes/layout/ThemedLoadingOverlay';
import { ThemedLoadingSpinner } from '@/platform/themes/layout/ThemedLoadingSpinner';
import { ProjectDocumentFields } from '@/components/entities/documents/ProjectDocumentFields';
import { AppLayout } from '@/components/layout/AppLayout';
import { ThemeProvider } from '@/platform/themes/ThemeContext.tsx';
import { useDocumentPages } from '@/hooks/useDocumentPages';
import { useProjectDocument } from '@/hooks/useProjectDocuments';
import { useProjectWithDocument } from '@/hooks/useProjects';
import { useTribeWithPositions } from '@/hooks/useTribesWithPositions';
import { labelService } from '@/services/label.service';
import { projectDocumentService } from '@/services/project-document.service';
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

const ProjectDocumentFormPageContent: React.FC = () => {
  const { t } = useTranslation();
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
  const {
    pages,
    loading: pagesLoading,
    refetch: refetchPages,
  } = useDocumentPages(
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
          <ProjectDocumentFields
            title={title}
            onTitleChange={setTitle}
            labelNames={labelNames}
            onLabelNamesChange={setLabelNames}
            allLabelSuggestions={allLabelSuggestions}
            tocDepth={tocDepth}
            onTocDepthChange={setTocDepth}
            content={content}
            onContentChange={setContent}
            attachments={attachments}
            onAttachmentsChange={setAttachments}
          />

          {isEdit && projectDocumentId && (
            <DocumentFormPagesEditor
              tribeId={tribeId!}
              projectId={projectId!}
              projectDocumentId={projectDocumentId}
              pages={pages}
              loading={pagesLoading}
              onReordered={refetchPages}
            />
          )}

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
