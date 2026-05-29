import EditorFileUploader from '@/app/platform/functions/documents/editor/EditorFileUploader.tsx';
import EditorJoditComponent from '@/app/platform/functions/documents/editor/EditorJoditComponent.tsx';
import { ThemedButton } from '@/app/platform/core/layout/themes/components/ThemedButton.tsx';
import { ThemedSvgIcon } from '@/app/platform/core/layout/themes/icons/ThemedSvgIcon.tsx';
import { ThemedInput } from '@/app/platform/core/layout/themes/components/ThemedInput.tsx';
import { ThemedLoadingOverlay } from '@/app/platform/core/layout/themes/components/ThemedLoadingOverlay.tsx';
import { ThemedSection } from '@/app/platform/core/layout/themes/components/ThemedSection.tsx';
import { ThemedText } from '@/app/platform/core/layout/themes/components/ThemedText.tsx';
import {
  CreateTabsConfigSection,
  DraftTabConfig,
} from '@/app/features/tribes-projects/projects/CreateTabsConfigSection.tsx';
import {
  FeatureDraft,
  FeatureInstancesSection,
} from '@/app/features/tribes-projects/projects/FeatureInstancesSection.tsx';
import { AppLayout } from '@/app/platform/core/layout/AppLayout.tsx';
import { ThemeProvider } from '@/app/platform/core/layout/themes/ThemeContext.tsx';
import { tabConfigService } from '@/app/features/glue/tab-config/tabConfig.service.ts';
import { useProjectWithDocumentMutations } from '@/app/features/tribes-projects/projects/useProjects.ts';
import { useTribeWithPositions } from '@/app/features/tribes-projects/tribes/useTribesWithPositions.ts';
import { projectFeaturesService } from '@/app/features/tribes-projects/projects/project-features.service.ts';
import {
  errorStyle,
  formActionsStyle,
  formContainerStyle,
} from '@/app/platform/core/layout/themes/theme.styles.tsx';
import { AttachmentFile } from '@/app/platform/functions/documents/document.types.ts';
import { MenuAction } from '@/app/platform/core/layout/menu.types.ts';

import React, { useEffect, useMemo, useState } from 'react';
import { useTranslation } from 'react-i18next';
import { useNavigate, useParams } from 'react-router-dom';

const BUILT_IN_TABS = (t: (k: string) => string): DraftTabConfig[] => [
  {
    key: 'description',
    label: t('tribes.tabDescription'),
    visible: true,
    order: 0,
    is_default: true,
  },
  {
    key: 'documents',
    label: t('projectDocuments.tab'),
    visible: true,
    order: 1,
    is_default: false,
  },
];

function buildDraftTabs(
  builtIn: DraftTabConfig[],
  features: FeatureDraft[],
  t: (k: string) => string,
): DraftTabConfig[] {
  const featureTabs: DraftTabConfig[] = features.map((f, i) => ({
    key: `feature_${f.localId}`,
    label: f.name || `${t('features.featureType')} ${i + 1}`,
    visible: true,
    order: builtIn.length + i,
    is_default: false,
  }));
  return [...builtIn, ...featureTabs];
}

function mergeTabsOnFeaturesChange(
  prev: DraftTabConfig[],
  newTabs: DraftTabConfig[],
): DraftTabConfig[] {
  const prevMap = new Map(prev.map((t) => [t.key, t]));
  return newTabs.map((t) => {
    const existing = prevMap.get(t.key);
    return existing
      ? { ...t, visible: existing.visible, is_default: existing.is_default }
      : t;
  });
}

const CreateProjectPageContent: React.FC = () => {
  const { t } = useTranslation();
  const navigate = useNavigate();
  const { tribeId } = useParams<{ tribeId: string }>();

  const { tribe } = useTribeWithPositions(tribeId || null);
  const { createProjectWithDocument, loading } =
    useProjectWithDocumentMutations();

  const [name, setName] = useState('');
  const [documentContent, setDocumentContent] = useState('');
  const [attachments, setAttachments] = useState<AttachmentFile[]>([]);
  const [featureDrafts, setFeatureDrafts] = useState<FeatureDraft[]>([]);
  const [draftTabs, setDraftTabs] = useState<DraftTabConfig[]>(() =>
    BUILT_IN_TABS(t),
  );
  const [error, setError] = useState<string | null>(null);
  const [submitting, setSubmitting] = useState(false);

  useEffect(() => {
    const newTabs = buildDraftTabs(BUILT_IN_TABS(t), featureDrafts, t);
    setDraftTabs((prev) => mergeTabsOnFeaturesChange(prev, newTabs));
  }, [featureDrafts, t]);

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
    if (!name.trim() || !tribeId) return;
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

      const createdFeatures = await Promise.all(
        featureDrafts
          .filter((f) => f.feature_type && f.name.trim())
          .map((f, i) =>
            projectFeaturesService.create(result.url_param_id, {
              feature_type: f.feature_type,
              name: f.name.trim(),
              position: i,
            }),
          ),
      );

      const tabConfigPayload = draftTabs.map((tab) => {
        const featureIndex = featureDrafts.findIndex(
          (f) => `feature_${f.localId}` === tab.key,
        );
        const resolvedKey =
          featureIndex >= 0 && createdFeatures[featureIndex]
            ? createdFeatures[featureIndex].id
            : tab.key;
        return {
          key: resolvedKey,
          label: tab.label,
          visible: tab.visible,
          order: tab.order,
          is_default: tab.is_default,
        };
      });

      await tabConfigService.save(`project:${result.id}`, tabConfigPayload);

      navigate(`/app/tribes/${tribeId}/projects/${result.url_param_id}`);
    } catch (err: unknown) {
      setError(
        err instanceof Error ? err.message : t('validation.errorOccurred'),
      );
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
            <ThemedText size="medium" as="h3" style={{ marginBottom: '8px' }}>
              {t('projects.name')}
            </ThemedText>
            <ThemedInput
              value={name}
              onChange={(e) => setName(e.target.value)}
              placeholder={t('projects.name').replace(' *', '')}
              disabled={submitting || loading}
              required
            />

            <ThemedText size="medium" as="h3" style={{ marginTop: '16px' }}>
              {t('projects.descriptionOptional')}
            </ThemedText>
            <div className="border border-gray-300 rounded-lg overflow-hidden">
              <EditorJoditComponent
                content={documentContent}
                onChange={setDocumentContent}
                compact
                minHeight={200}
              />
            </div>
            <div className="mb-6">
              <EditorFileUploader
                attachments={attachments}
                onAttachmentsChange={setAttachments}
              />
            </div>

            <FeatureInstancesSection
              drafts={featureDrafts}
              onChange={setFeatureDrafts}
              disabled={submitting || loading}
            />

            <CreateTabsConfigSection tabs={draftTabs} onChange={setDraftTabs} />
          </ThemedSection>

          <div style={formActionsStyle}>
            <ThemedButton
              variant="secondary"
              onClick={() => navigate(`/app/tribes/${tribeId}`)}
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
              isLoading={submitting || loading}
              disabled={submitting || loading}
              leftIcon={
                <ThemedSvgIcon name="plus" color="currentColor" size={16} />
              }
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
