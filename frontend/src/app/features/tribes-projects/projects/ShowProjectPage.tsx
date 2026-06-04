import { ThemedButton } from '@/app/platform/core/layout/themes/components/ThemedButton.tsx';
import { ThemedSvgIcon } from '@/app/platform/core/layout/themes/icons/ThemedSvgIcon.tsx';
import { ThemedBadge } from '@/app/platform/core/layout/themes/components/ThemedBadge.tsx';
import { ThemedConfirmDialog } from '@/app/platform/core/layout/themes/components/ThemedConfirmDialog.tsx';
import { ThemedLoadingSpinner } from '@/app/platform/core/layout/themes/components/ThemedLoadingSpinner.tsx';
import { ThemedSection } from '@/app/platform/core/layout/themes/components/ThemedSection.tsx';
import { ThemeCodeSelect } from '@/app/platform/core/layout/themes/components/ThemeCodeSelect.tsx';
import { ThemePickerModal } from '@/app/platform/core/layout/themes/components/ThemePickerModal.tsx';
import { predefinedThemes } from '@/app/platform/core/layout/themes/themes.ts';
import { ThemedTabs } from '@/app/platform/core/layout/themes/components/ThemedTabs.tsx';
import { ThemedText } from '@/app/platform/core/layout/themes/components/ThemedText.tsx';
import { ProjectDocumentsTab } from '@/app/features/tribes-projects/projects/ProjectDocumentsTab.tsx';
import { ProjectTribesTab } from '@/app/features/tribes-projects/projects/ProjectTribesTab.tsx';
import { AppLayout } from '@/app/platform/core/layout/AppLayout.tsx';
import { TabActionsProvider } from '@/app/platform/core/layout/TabActionsContext.tsx';
import { ThemeProvider, useTheme } from '@/app/platform/core/layout/themes/ThemeContext.tsx';
import { getFeatureComponent } from '@/app/features/glue/registry.ts';
import { TabConfigPopup } from '@/app/features/glue/tab-config/TabConfigPopup.tsx';
import { useTabConfig } from '@/app/features/glue/tab-config/useTabConfig.ts';
import { useCurrentUserProfile } from '@/app/platform/functions/people/users/useCurrentUserProfile.ts';
import {
  useFeatureTypes,
  useProjectFeatures,
} from '@/app/features/glue/features/useProjectFeatures.ts';
import {
  useProjectTribesWithMembers,
  useProjectWithDocument,
  useProjectWithDocumentMutations,
  useUserProjectsByTribe,
} from '@/app/features/tribes-projects/projects/useProjects.ts';
import { useTribeWithPositions } from '@/app/features/tribes-projects/tribes/useTribesWithPositions.ts';
import { useUrlTab } from '@/app/features/glue/url-tab/useUrlTab.ts';
import { errorStyle } from '@/app/platform/core/layout/themes/theme.styles.tsx';
import { AttachmentFile } from '@/app/platform/functions/documents/document.types.ts';
import { MenuAction } from '@/app/platform/core/layout/menu.types.ts';
import { ProjectEntry } from '@/app/features/tribes-projects/projects/projects.query.types.ts';

import { BookmarkToggle } from '@/app/features/bookmarks/BookmarkToggle.tsx';

import React, { useEffect, useMemo, useState } from 'react';
import { useTranslation } from 'react-i18next';
import { useLocation, useNavigate, useParams, useSearchParams } from 'react-router-dom';

import {
  Download,
  File,
  FileText,
  Film,
  Image,
  Music,
  Paperclip,
} from 'lucide-react';

const getPositionVariant = (
  position: string,
): 'primary' | 'accent' | 'ghost' => {
  if (position === 'manager') return 'accent';
  if (position === 'member') return 'primary';
  return 'ghost';
};

const AddFeatureModal: React.FC<{
  onClose: () => void;
  onAdd: (featureType: string, name: string) => Promise<void>;
}> = ({ onClose, onAdd }) => {
  const { t } = useTranslation();
  const { theme } = useTheme();
  const { featureTypes } = useFeatureTypes();
  const [featureType, setFeatureType] = useState('');
  const [name, setName] = useState('');
  const [saving, setSaving] = useState(false);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!featureType || !name.trim()) return;
    setSaving(true);
    await onAdd(featureType, name.trim());
    setSaving(false);
    onClose();
  };

  const inputStyle: React.CSSProperties = {
    width: '100%',
    padding: '8px 12px',
    border: `1px solid ${theme.colors.border}`,
    borderRadius: '8px',
    backgroundColor: theme.colors.surface,
    color: theme.colors.text,
    fontSize: 'var(--font-sm)',
    boxSizing: 'border-box',
  };

  return (
    <div
      style={{
        position: 'fixed',
        inset: 0,
        backgroundColor: 'rgba(0,0,0,0.5)',
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'center',
        zIndex: 1000,
      }}
    >
      <div
        style={{
          backgroundColor: theme.colors.surface,
          borderRadius: '12px',
          padding: '24px',
          width: '400px',
          maxWidth: '90vw',
          border: `1px solid ${theme.colors.border}`,
        }}
      >
        <ThemedText size="medium" as="h3" style={{ marginBottom: '16px' }}>
          {t('features.addFeature')}
        </ThemedText>
        <form onSubmit={handleSubmit}>
          <div style={{ marginBottom: '12px' }}>
            <label
              style={{
                display: 'block',
                fontSize: 'var(--font-sm)',
                marginBottom: '4px',
                color: theme.colors.secondary,
              }}
            >
              {t('features.featureType')}
            </label>
            <select
              value={featureType}
              onChange={(e) => setFeatureType(e.target.value)}
              style={inputStyle}
              required
            >
              <option value="">{t('features.selectType')}</option>
              {featureTypes.map((ft) => (
                <option key={ft.feature_type} value={ft.feature_type}>
                  {ft.label}
                </option>
              ))}
            </select>
          </div>
          <div style={{ marginBottom: '20px' }}>
            <label
              style={{
                display: 'block',
                fontSize: 'var(--font-sm)',
                marginBottom: '4px',
                color: theme.colors.secondary,
              }}
            >
              {t('features.featureName')}
            </label>
            <input
              type="text"
              style={inputStyle}
              value={name}
              onChange={(e) => setName(e.target.value)}
              placeholder={t('features.featureNamePlaceholder')}
              required
            />
          </div>
          <div
            style={{ display: 'flex', gap: '8px', justifyContent: 'flex-end' }}
          >
            <ThemedButton
              variant="ghost"
              type="button"
              onClick={onClose}
              disabled={saving}
              leftIcon={
                <ThemedSvgIcon name="x" color="currentColor" size={16} />
              }
            >
              {t('common.cancel')}
            </ThemedButton>
            <ThemedButton
              variant="primary"
              type="submit"
              disabled={saving || !featureType || !name.trim()}
              leftIcon={
                <ThemedSvgIcon name="plus" color="currentColor" size={16} />
              }
            >
              {t('common.create')}
            </ThemedButton>
          </div>
        </form>
      </div>
    </div>
  );
};

const ShowProjectPageContent: React.FC = () => {
  const { t } = useTranslation();
  const { theme, setTheme } = useTheme();
  const location = useLocation();
  const navigate = useNavigate();
  const { tribeId, projectId } = useParams<{
    tribeId: string;
    projectId: string;
  }>();
  const [searchParams] = useSearchParams();

  const { user } = useCurrentUserProfile();
  const { tribe } = useTribeWithPositions(tribeId || null);
  const { project, loading, error, refetch: refetchProject } = useProjectWithDocument(projectId || null);
  const { updateProjectWithDocument } = useProjectWithDocumentMutations();

  const [pageThemeCode, setPageThemeCode] = useState<string | null>(null);

  useEffect(() => {
    const code = project?.theme_code ?? null;
    setPageThemeCode(code);
    setTheme(code || 'default');
  }, [project?.theme_code, setTheme]);

  const { projects: tribeProjects } = useUserProjectsByTribe(
    tribeId || '',
    user?.id || '',
    { enabled: !!tribeId && !!user?.id },
  );
  const { features, createFeature, updateFeature, archiveFeature } =
    useProjectFeatures(projectId || null);
  const { tribes: projectTribes } = useProjectTribesWithMembers(
    projectId || null,
  );

  const initialLabelId = searchParams.get('labelId') || null;
  const [showAddFeature, setShowAddFeature] = useState(false);
  const [showTabConfig, setShowTabConfig] = useState(false);
  const [showProjectThemePicker, setShowProjectThemePicker] = useState(false);
  const [showFeatureThemePicker, setShowFeatureThemePicker] = useState(false);
  const [archiveTarget, setArchiveTarget] = useState<{
    id: string;
    name: string;
  } | null>(null);
  const [renameTarget, setRenameTarget] = useState<{
    id: string;
    name: string;
    theme_code?: string | null;
  } | null>(null);
  const [renameValue, setRenameValue] = useState('');
  const [renameThemeCode, setRenameThemeCode] = useState<string | null>(null);

  const myProjectPosition = useMemo((): ProjectEntry | null => {
    if (!projectId) return null;
    const rows = tribeProjects.filter(
      (r) => r.project_url_param_id === projectId,
    );
    if (rows.length === 0) return null;
    const entry: ProjectEntry = {
      project_id: rows[0].project_id,
      project_url_param_id: projectId,
      project_name: rows[0].project_name,
      direct_position: null,
      represented_persons: [],
    };
    for (const r of rows) {
      if (!r.via_represents) {
        entry.direct_position = r.effective_position;
      } else if (r.person_first_name && r.person_last_name) {
        entry.represented_persons.push({
          first_name: r.person_first_name,
          last_name: r.person_last_name,
          position: r.effective_position,
        });
      }
    }
    return entry;
  }, [projectId, tribeProjects]);

  const isManager = useMemo(() => {
    if (!myProjectPosition) return false;
    return (
      myProjectPosition.direct_position === 'manager' ||
      myProjectPosition.represented_persons.some(
        (p) => p.position === 'manager',
      )
    );
  }, [myProjectPosition]);

  const canEdit = useMemo(() => {
    if (user?.permissions?.includes('admin')) return true;
    if (!myProjectPosition) return false;
    const allPositions = [
      myProjectPosition.direct_position,
      ...myProjectPosition.represented_persons.map((p) => p.position),
    ].filter(Boolean);
    return allPositions.some((p) => p === 'manager' || p === 'member');
  }, [myProjectPosition, user]);

  const allTabs = useMemo(() => {
    const base = [
      { key: 'description', label: t('tribes.tabDescription') },
      { key: 'documents', label: t('projectDocuments.tab') },
    ];
    const tribeTab =
      projectTribes.length > 1
        ? [{ key: 'tribes', label: t('projects.tabTribes') }]
        : [];
    const featureTabs = features.map((f) => ({
      key: f.id,
      label: f.name,
      color: f.theme_code ? predefinedThemes[f.theme_code]?.colors.primary : undefined,
    }));
    return [...base, ...tribeTab, ...featureTabs];
  }, [features, projectTribes.length, t]);

  const contextKey = projectId ? `project:${projectId}` : '';
  const { visibleTabs, defaultTabKey, tabsWithConfig, saveConfig } =
    useTabConfig(contextKey, allTabs);

  const basePath = `/app/tribes/${tribeId ?? ''}/projects/${projectId ?? ''}`;
  const { activeTab, breadcrumbTabs, handleTabChange, navTabs } = useUrlTab(
    visibleTabs,
    basePath,
    defaultTabKey,
  );

  const breadcrumbs = useMemo(
    () => [
      { label: t('common.home'), path: '/app' },
      { label: t('tribes.title'), path: '/app/tribes' },
      {
        label: tribe?.name || t('common.loading'),
        path: `/app/tribes/${tribeId}`,
      },
      { label: project?.name || t('common.loading') },
    ],
    [tribe?.name, project?.name, tribeId, t],
  );

  const activeFeature = useMemo(
    () => features.find((f) => f.id === activeTab) ?? null,
    [features, activeTab],
  );
  const FeatureComponent = activeFeature
    ? getFeatureComponent(activeFeature.feature_type)
    : null;

  const menuActions = useMemo(
    (): MenuAction[] => [
      {
        icon: 'settings',
        label: t('tabConfig.configure'),
        onClick: () => setShowTabConfig(true),
      },
      ...(isManager
        ? [
            {
              icon: 'plus' as const,
              label: t('features.feature'),
              onClick: () => setShowAddFeature(true),
            },
            {
              icon: 'palette' as const,
              label: t('common.project'),
              onClick: () => setShowProjectThemePicker(true),
            },
            {
              icon: 'pencil' as const,
              label: t('common.project'),
              onClick: () =>
                navigate(`/app/tribes/${tribeId}/projects/${projectId}/edit`),
            },
          ]
        : []),
    ],
    [isManager, tribeId, projectId, t, navigate],
  );

  const tabActions = useMemo(
    (): MenuAction[] =>
      isManager && activeFeature
        ? [
            {
              icon: 'pencil' as const,
              label: t('features.feature'),
              onClick: () => {
                setRenameValue(activeFeature.name);
                setRenameThemeCode(activeFeature.theme_code ?? null);
                setRenameTarget({
                  id: activeFeature.id,
                  name: activeFeature.name,
                  theme_code: activeFeature.theme_code,
                });
              },
            },
            {
              icon: 'palette' as const,
              label: t('features.feature'),
              onClick: () => setShowFeatureThemePicker(true),
            },
            {
              icon: 'archive' as const,
              label: t('features.feature'),
              onClick: () =>
                setArchiveTarget({
                  id: activeFeature.id,
                  name: activeFeature.name,
                }),
              variant: 'danger' as const,
            },
          ]
        : [],
    [isManager, activeFeature, t],
  );

  const attachmentCardStyle: React.CSSProperties = {
    padding: '12px 16px',
    backgroundColor: theme.colors.surface,
    border: `1px solid ${theme.colors.border}`,
    borderRadius: '8px',
    display: 'flex',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: '8px',
    transition: 'all 0.2s ease',
  };

  const getFileIcon = (type: string) => {
    if (type.startsWith('image/')) return <Image size={20} />;
    if (type.startsWith('video/')) return <Film size={20} />;
    if (type.startsWith('audio/')) return <Music size={20} />;
    if (type.includes('pdf') || type.includes('document'))
      return <FileText size={20} />;
    return <File size={20} />;
  };

  const formatFileSize = (bytes: number): string => {
    if (bytes === 0) return '0 Bytes';
    const k = 1024;
    const sizes = ['Bytes', 'KB', 'MB', 'GB'];
    const i = Math.floor(Math.log(bytes) / Math.log(k));
    return parseFloat((bytes / Math.pow(k, i)).toFixed(2)) + ' ' + sizes[i];
  };

  if (loading) {
    return (
      <AppLayout breadcrumbs={breadcrumbs}>
        <div
          style={{
            display: 'flex',
            justifyContent: 'center',
            alignItems: 'center',
            minHeight: '400px',
          }}
        >
          <ThemedLoadingSpinner size="sm" />
        </div>
      </AppLayout>
    );
  }

  if (error || !project) {
    return (
      <AppLayout breadcrumbs={breadcrumbs}>
        <div style={errorStyle}>
          <strong>{t('common.error')}</strong> {error || t('projects.notFound')}
        </div>
      </AppLayout>
    );
  }

  return (
    <TabActionsProvider>
    <AppLayout
      breadcrumbs={breadcrumbs}
      breadcrumbTabs={breadcrumbTabs}
      menuActions={menuActions}
      tabActions={tabActions}
      bookmarkSlot={project?.name ? <BookmarkToggle pagePath={location.pathname} pageTitle={project.name} /> : null}
    >
      {showTabConfig && (
        <TabConfigPopup
          tabsWithConfig={tabsWithConfig}
          onSave={saveConfig}
          onClose={() => setShowTabConfig(false)}
        />
      )}

      {showProjectThemePicker && projectId && (
        <ThemePickerModal
          title={t('theme.selectTheme')}
          currentThemeCode={project?.theme_code}
          onSave={async (themeCode) => {
            await updateProjectWithDocument(projectId, { theme_code: themeCode });
            setPageThemeCode(themeCode);
            setTheme(themeCode || 'default');
            refetchProject();
          }}
          onClose={() => setShowProjectThemePicker(false)}
        />
      )}

      {showFeatureThemePicker && activeFeature && (
        <ThemePickerModal
          title={t('theme.selectTheme')}
          currentThemeCode={activeFeature.theme_code}
          onSave={async (themeCode) => {
            await updateFeature(activeFeature.id, { theme_code: themeCode });
          }}
          onClose={() => setShowFeatureThemePicker(false)}
        />
      )}

      {/* Tabs */}
      <ThemedSection themeId={pageThemeCode ?? 'main_1'}>
        <ThemedTabs
          tabs={navTabs}
          activeTab={activeTab}
          onTabChange={handleTabChange}
        />

        <div style={{ paddingTop: '16px' }}>
          {activeTab === 'documents' && projectId && tribeId && (
            <ProjectDocumentsTab
              projectId={projectId}
              tribeId={tribeId}
              canEdit={canEdit}
              initialLabelId={initialLabelId}
            />
          )}

          {activeTab === 'tribes' && (
              <ProjectTribesTab tribes={projectTribes} />
          )}

          {activeTab === 'description' && (
            <>
              <ThemedSection>
                {/* User position on this project */}
                {myProjectPosition &&
                  (myProjectPosition.direct_position ||
                    myProjectPosition.represented_persons.length > 0) && (
                    <div
                      style={{
                        display: 'flex',
                        flexWrap: 'wrap',
                        gap: '8px',
                        marginBottom: '8px',
                      }}
                    >
                      {myProjectPosition.direct_position && (
                        <ThemedBadge
                          variant={getPositionVariant(
                            myProjectPosition.direct_position,
                          )}
                        >
                          {t(`positions.${myProjectPosition.direct_position}`)}
                        </ThemedBadge>
                      )}
                      {myProjectPosition.represented_persons.map((p, i) => (
                        <ThemedBadge
                          key={i}
                          variant={getPositionVariant(p.position)}
                        >
                          {t(`positions.${p.position}`)} {t('tribes.as')}{' '}
                          {p.first_name} {p.last_name}
                        </ThemedBadge>
                      ))}
                    </div>
                  )}
              </ThemedSection>

              {/* Description */}
              {project.document_content_html && (
                <div
                  className="prose max-w-none"
                  style={{
                    padding: '16px',
                    backgroundColor: theme.colors.surface,
                    borderRadius: '8px',
                    border: `1px solid ${theme.colors.border}`,
                    marginBottom: '16px',
                  }}
                  dangerouslySetInnerHTML={{
                    __html: project.document_content_html,
                  }}
                />
              )}

              {/* Attachments */}
              {project.document_attachments &&
                project.document_attachments.length > 0 && (
                  <>
                    <div
                      style={{
                        display: 'flex',
                        alignItems: 'center',
                        gap: '8px',
                        marginBottom: '12px',
                      }}
                    >
                      <Paperclip size={20} color={theme.colors.secondary} />
                      <ThemedText size="small" as="h4">
                        {t('tribes.attachmentsCount', {
                          count: project.document_attachments.length,
                        })}
                      </ThemedText>
                    </div>
                    {project.document_attachments.map(
                      (attachment: AttachmentFile) => (
                        <div
                          key={attachment.id}
                          style={attachmentCardStyle}
                          onMouseEnter={(e) => {
                            e.currentTarget.style.backgroundColor = `${theme.colors.primary}10`;
                            e.currentTarget.style.borderColor =
                              theme.colors.primary;
                          }}
                          onMouseLeave={(e) => {
                            e.currentTarget.style.backgroundColor =
                              theme.colors.surface;
                            e.currentTarget.style.borderColor =
                              theme.colors.border;
                          }}
                        >
                          <div
                            style={{
                              display: 'flex',
                              alignItems: 'center',
                              gap: '12px',
                            }}
                          >
                            <span style={{ color: theme.colors.primary }}>
                              {getFileIcon(attachment.type)}
                            </span>
                            <div>
                              <ThemedText variant="primary" size="small">
                                {attachment.name}
                              </ThemedText>
                              <ThemedText variant="secondary" size="small">
                                {formatFileSize(attachment.size)}
                              </ThemedText>
                            </div>
                          </div>
                          <a
                            href={attachment.url}
                            download={attachment.name}
                            target="_blank"
                            rel="noopener noreferrer"
                            style={{
                              display: 'flex',
                              alignItems: 'center',
                              gap: '6px',
                              padding: '8px 12px',
                              backgroundColor: theme.colors.primary,
                              color: 'white',
                              borderRadius: '6px',
                              textDecoration: 'none',
                              fontSize: '14px',
                              fontWeight: 500,
                            }}
                            onMouseEnter={(e) => {
                              e.currentTarget.style.opacity = '0.9';
                            }}
                            onMouseLeave={(e) => {
                              e.currentTarget.style.opacity = '1';
                            }}
                          >
                            <Download size={16} />
                            {t('tribes.download')}
                          </a>
                        </div>
                      ),
                    )}
                  </>
                )}
            </>
          )}

          {activeFeature && FeatureComponent && (
            activeFeature.theme_code ? (
              <ThemedSection themeId={activeFeature.theme_code}>
                <FeatureComponent
                  featureInstanceId={activeFeature.id}
                  canEdit={canEdit}
                  isManager={isManager}
                />
              </ThemedSection>
            ) : (
              <FeatureComponent
                featureInstanceId={activeFeature.id}
                canEdit={canEdit}
                isManager={isManager}
              />
            )
          )}

          {activeFeature && !FeatureComponent && (
            <ThemedText variant="secondary" size="small">
              {t('features.unknownType', { type: activeFeature.feature_type })}
            </ThemedText>
          )}
        </div>
      </ThemedSection>

      <ThemedConfirmDialog
        isOpen={!!archiveTarget}
        onClose={() => setArchiveTarget(null)}
        onConfirm={async () => {
          if (!archiveTarget) return;
          await archiveFeature(archiveTarget.id);
          navigate(`/app/tribes/${tribeId}/projects/${projectId}/description`);
          setArchiveTarget(null);
        }}
        title={t('features.archiveTitle')}
        message={t('features.archiveMessage', {
          name: archiveTarget?.name ?? '',
        })}
        confirmText={t('tribes.archive')}
        variant="warning"
      />

      {showAddFeature && (
        <AddFeatureModal
          onClose={() => setShowAddFeature(false)}
          onAdd={async (featureType, name) => {
            const created = await createFeature({
              feature_type: featureType,
              name,
              position: features.length,
            });
            if (created)
              navigate(
                `/app/tribes/${tribeId}/projects/${projectId}/${created.id}`,
              );
          }}
        />
      )}

      {renameTarget && (
        <div
          style={{
            position: 'fixed',
            inset: 0,
            backgroundColor: 'rgba(0,0,0,0.5)',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            zIndex: 1000,
          }}
        >
          <div
            style={{
              backgroundColor: theme.colors.surface,
              borderRadius: '12px',
              padding: '24px',
              width: '360px',
              maxWidth: '90vw',
              border: `1px solid ${theme.colors.border}`,
            }}
          >
            <ThemedText size="medium" as="h3" style={{ marginBottom: '16px' }}>
              {t('features.rename')}
            </ThemedText>
            <form
              onSubmit={async (e) => {
                e.preventDefault();
                const trimmed = renameValue.trim();
                const updates: { name?: string; theme_code?: string | null } = {};
                if (trimmed && trimmed !== renameTarget.name) updates.name = trimmed;
                if (renameThemeCode !== (renameTarget.theme_code ?? null)) updates.theme_code = renameThemeCode;
                if (Object.keys(updates).length > 0)
                  await updateFeature(renameTarget.id, updates);
                setRenameTarget(null);
              }}
            >
              <input
                autoFocus
                value={renameValue}
                onChange={(e) => setRenameValue(e.target.value)}
                onKeyDown={(e) => {
                  if (e.key === 'Escape') setRenameTarget(null);
                }}
                style={{
                  width: '100%',
                  padding: '8px 12px',
                  border: `1px solid ${theme.colors.border}`,
                  borderRadius: '8px',
                  backgroundColor: theme.colors.surface,
                  color: theme.colors.text,
                  fontSize: 'var(--font-sm)',
                  boxSizing: 'border-box',
                  marginBottom: '16px',
                }}
              />
              <div style={{ marginBottom: '16px' }}>
                <ThemeCodeSelect
                  label={t('theme.selectTheme')}
                  value={renameThemeCode}
                  onChange={setRenameThemeCode}
                />
              </div>
              <div
                style={{
                  display: 'flex',
                  gap: '8px',
                  justifyContent: 'flex-end',
                }}
              >
                <ThemedButton
                  variant="ghost"
                  type="button"
                  onClick={() => setRenameTarget(null)}
                  leftIcon={
                    <ThemedSvgIcon name="x" color="currentColor" size={16} />
                  }
                >
                  {t('common.cancel')}
                </ThemedButton>
                <ThemedButton
                  variant="primary"
                  type="submit"
                  disabled={!renameValue.trim()}
                  leftIcon={
                    <ThemedSvgIcon name="save" color="currentColor" size={16} />
                  }
                >
                  {t('common.save')}
                </ThemedButton>
              </div>
            </form>
          </div>
        </div>
      )}
    </AppLayout>
    </TabActionsProvider>
  );
};

const ShowProjectPage: React.FC = () => (
  <ThemeProvider defaultTheme="default">
    <ShowProjectPageContent />
  </ThemeProvider>
);

export default ShowProjectPage;
