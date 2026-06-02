import { ThemedButton } from '@/app/platform/core/layout/themes/components/ThemedButton.tsx';
import { ThemedSvgIcon } from '@/app/platform/core/layout/themes/icons/ThemedSvgIcon.tsx';
import { ThemedSelect } from '@/app/platform/core/layout/themes/components/ThemedSelect.tsx';
import { StatusBadge } from '@/app/platform/core/layout/themes/components/StatusBadge.tsx';
import { ThemedCard } from '@/app/platform/core/layout/themes/components/ThemedCard.tsx';
import { ThemedConfirmDialog } from '@/app/platform/core/layout/themes/components/ThemedConfirmDialog.tsx';
import { ThemedLoadingSpinner } from '@/app/platform/core/layout/themes/components/ThemedLoadingSpinner.tsx';
import { ThemedTable } from '@/app/platform/core/layout/themes/components/ThemedTable.tsx';
import { ThemedText } from '@/app/platform/core/layout/themes/components/ThemedText.tsx';
import {
  AdminNavigation,
  adminMainThemeId,
} from '@/app/platform/core/layout/AdminNavigation.tsx';
import { AppLayout } from '@/app/platform/core/layout/AppLayout.tsx';
import { ThemeProvider, useTheme } from '@/app/platform/core/layout/themes/ThemeContext.tsx';
import { apiService } from '@/app/platform/core/api/api.service.ts';
import { projectFeaturesService } from '@/app/features/tribes-projects/projects/project-features.service.ts';
import { projectService } from '@/app/features/tribes-projects/projects/project.service.ts';
import {
  FeatureTypeInfo,
  ProjectFeatureInstance,
} from '@/app/features/tribes-projects/projects/project-features.types.ts';
import { Project } from '@/app/features/tribes-projects/projects/project.types.ts';

import React, { useCallback, useEffect, useMemo, useState } from 'react';
import { useTranslation } from 'react-i18next';

interface ProjectTribeEntry {
  tribe_id: string;
  tribe_name: string;
}

interface CreateFormState {
  feature_type: string;
  name: string;
}

function FeaturesPageContent() {
  const { t } = useTranslation();
  const { theme } = useTheme();

  const [projects, setProjects] = useState<Project[]>([]);
  const [projectsLoading, setProjectsLoading] = useState(true);
  const [selectedProjectId, setSelectedProjectId] = useState('');

  const [projectTribes, setProjectTribes] = useState<ProjectTribeEntry[]>([]);

  const [features, setFeatures] = useState<ProjectFeatureInstance[]>([]);
  const [featuresLoading, setFeaturesLoading] = useState(false);
  const [featuresError, setFeaturesError] = useState<string | null>(null);

  const [featureTypes, setFeatureTypes] = useState<FeatureTypeInfo[]>([]);

  const [showCreateForm, setShowCreateForm] = useState(false);
  const [createForm, setCreateForm] = useState<CreateFormState>({
    feature_type: '',
    name: '',
  });
  const [creating, setCreating] = useState(false);

  const [confirm, setConfirm] = useState<{
    id: string;
    name: string;
    nextStatus: 'active' | 'archived';
  } | null>(null);
  const [actioning, setActioning] = useState(false);

  useEffect(() => {
    projectService
      .getAll()
      .then(setProjects)
      .finally(() => setProjectsLoading(false));
    projectFeaturesService.getFeatureTypes().then(setFeatureTypes);
  }, []);

  const loadFeatures = useCallback((projectId: string) => {
    if (!projectId) return;
    setFeaturesLoading(true);
    setFeaturesError(null);
    projectFeaturesService
      .listByProject(projectId)
      .then(setFeatures)
      .catch((e) => setFeaturesError(e.message))
      .finally(() => setFeaturesLoading(false));
  }, []);

  const handleProjectChange = (value: string) => {
    setSelectedProjectId(value);
    setShowCreateForm(false);
    setFeatures([]);
    setProjectTribes([]);
    if (value) {
      loadFeatures(value);
      apiService
        .get<ProjectTribeEntry[]>(`/query/projects/${value}/tribes`)
        .then(setProjectTribes)
        .catch(() => setProjectTribes([]));
    }
  };

  const handleStatusChange = async () => {
    if (!confirm || !selectedProjectId) return;
    setActioning(true);
    try {
      const updated = await projectFeaturesService.update(
        selectedProjectId,
        confirm.id,
        { status: confirm.nextStatus },
      );
      setFeatures((prev) =>
        prev.map((f) =>
          f.id === confirm.id ? { ...f, status: updated.status } : f,
        ),
      );
    } catch (e: unknown) {
      alert(e instanceof Error ? e.message : 'An error occurred');
    } finally {
      setActioning(false);
      setConfirm(null);
    }
  };

  const handleCreate = async (e: React.FormEvent) => {
    e.preventDefault();
    if (
      !selectedProjectId ||
      !createForm.feature_type ||
      !createForm.name.trim()
    )
      return;
    setCreating(true);
    try {
      const created = await projectFeaturesService.create(selectedProjectId, {
        feature_type: createForm.feature_type,
        name: createForm.name.trim(),
        position: features.filter((f) => f.status === 'active').length,
      });
      setFeatures((prev) => [...prev, created]);
      setShowCreateForm(false);
      setCreateForm({ feature_type: '', name: '' });
    } catch (e: unknown) {
      alert(e instanceof Error ? e.message : 'An error occurred');
    } finally {
      setCreating(false);
    }
  };

  const projectOptions = useMemo(
    () => [
      { value: '', label: t('admin.features.selectProject') },
      ...projects.map((p) => ({ value: p.id, label: p.name })),
    ],
    [projects, t],
  );

  const featureTypeOptions = useMemo(
    () => [
      { value: '', label: t('features.selectType') },
      ...featureTypes.map((ft) => ({
        value: ft.feature_type,
        label: ft.label,
      })),
    ],
    [featureTypes, t],
  );

  const columns = useMemo(
    () => [
      {
        key: 'name',
        header: t('common.name'),
        render: (f: ProjectFeatureInstance) => (
          <ThemedText variant="primary" size="small">
            {f.name}
          </ThemedText>
        ),
      },
      {
        key: 'feature_type',
        header: t('admin.features.type'),
        render: (f: ProjectFeatureInstance) => (
          <code
            style={{ fontSize: 'var(--font-sm)', color: theme.colors.primary }}
          >
            {f.feature_type}
          </code>
        ),
      },
      {
        key: 'status',
        header: t('monitoring.status'),
        render: (f: ProjectFeatureInstance) => (
          <StatusBadge status={f.status} />
        ),
      },
      {
        key: 'actions',
        header: t('common.actions'),
        render: (f: ProjectFeatureInstance) => (
          <ThemedButton
            variant="ghost"
            onClick={() =>
              setConfirm({
                id: f.id,
                name: f.name,
                nextStatus: f.status === 'active' ? 'archived' : 'active',
              })
            }
            leftIcon={
              f.status === 'active' ? (
                <ThemedSvgIcon name="archive" color="currentColor" size={16} />
              ) : (
                <ThemedSvgIcon name="refresh" color="currentColor" size={16} />
              )
            }
          >
            {f.status === 'active'
              ? t('tribes.archive')
              : t('admin.features.restore')}
          </ThemedButton>
        ),
      },
    ],
    [t, theme],
  );

  const breadcrumbs = useMemo(
    () => [
      { label: t('common.home'), path: '/app' },
      { label: t('common.admin'), path: '/admin' },
      { label: t('admin.features') },
    ],
    [t],
  );

  const headerActions = <AdminNavigation currentPage="features" />;

  return (
    <AppLayout breadcrumbs={breadcrumbs} headerActions={headerActions}>
      <ThemedCard>
        <div
          style={{
            display: 'flex',
            gap: 'var(--space-sm)',
            alignItems: 'flex-end',
            flexWrap: 'wrap',
          }}
        >
          <div style={{ flex: 1, minWidth: 220 }}>
            <ThemedText
              variant="secondary"
              size="small"
              style={{ marginBottom: 4 }}
            >
              {t('common.project')}
            </ThemedText>
            {projectsLoading ? (
              <ThemedLoadingSpinner />
            ) : (
              <ThemedSelect
                value={selectedProjectId}
                onChange={handleProjectChange}
                options={projectOptions}
              />
            )}
            {projectTribes.length > 0 && (
              <div
                style={{
                  display: 'flex',
                  gap: '6px',
                  flexWrap: 'wrap',
                  marginTop: '8px',
                }}
              >
                {projectTribes.map((pt) => (
                  <span
                    key={pt.tribe_id}
                    style={{
                      display: 'inline-block',
                      padding: '2px 10px',
                      borderRadius: '12px',
                      backgroundColor: theme.colors.primary + '22',
                      color: theme.colors.primary,
                      fontSize: 'var(--font-sm)',
                      fontWeight: 500,
                    }}
                  >
                    {pt.tribe_name}
                  </span>
                ))}
              </div>
            )}
          </div>
          {selectedProjectId && (
            <ThemedButton
              variant="primary"
              onClick={() => setShowCreateForm((s) => !s)}
              leftIcon={
                <ThemedSvgIcon name="plus" color="currentColor" size={16} />
              }
            >
              {t('features.feature')}
            </ThemedButton>
          )}
        </div>
      </ThemedCard>

      {showCreateForm && selectedProjectId && (
        <ThemedCard>
          <form onSubmit={handleCreate}>
            <ThemedText
              variant="primary"
              size="small"
              style={{ marginBottom: 'var(--space-sm)', fontWeight: 600 }}
            >
              {t('features.addFeature')}
            </ThemedText>
            <div
              style={{
                display: 'flex',
                gap: 'var(--space-sm)',
                alignItems: 'flex-end',
                flexWrap: 'wrap',
              }}
            >
              <div>
                <ThemedText
                  variant="secondary"
                  size="small"
                  style={{ marginBottom: 4 }}
                >
                  {t('features.featureType')}
                </ThemedText>
                <ThemedSelect
                  value={createForm.feature_type}
                  onChange={(v) =>
                    setCreateForm((f) => ({ ...f, feature_type: v }))
                  }
                  options={featureTypeOptions}
                />
              </div>
              <div style={{ flex: 1, minWidth: 180 }}>
                <ThemedText
                  variant="secondary"
                  size="small"
                  style={{ marginBottom: 4 }}
                >
                  {t('features.featureName')}
                </ThemedText>
                <input
                  type="text"
                  value={createForm.name}
                  onChange={(e) =>
                    setCreateForm((f) => ({ ...f, name: e.target.value }))
                  }
                  placeholder={t('features.featureNamePlaceholder')}
                  style={{
                    width: '100%',
                    padding: '8px 12px',
                    border: `1px solid ${theme.colors.border}`,
                    borderRadius: '8px',
                    backgroundColor: theme.colors.surface,
                    color: theme.colors.text,
                    fontSize: 'var(--font-sm)',
                    boxSizing: 'border-box',
                  }}
                />
              </div>
              <ThemedButton
                variant="primary"
                type="submit"
                disabled={
                  creating ||
                  !createForm.feature_type ||
                  !createForm.name.trim()
                }
              >
                {t('common.create')}
              </ThemedButton>
              <ThemedButton
                variant="ghost"
                type="button"
                onClick={() => setShowCreateForm(false)}
              >
                {t('common.cancel')}
              </ThemedButton>
            </div>
          </form>
        </ThemedCard>
      )}

      {selectedProjectId && (
        <ThemedCard>
          {featuresError && (
            <ThemedText
              variant="danger"
              size="small"
              style={{ marginBottom: 'var(--space-sm)' }}
            >
              {featuresError}
            </ThemedText>
          )}
          {featuresLoading ? (
            <ThemedLoadingSpinner />
          ) : (
            <ThemedTable
              columns={columns}
              data={features}
              getRowId={(f) => f.id}
            />
          )}
        </ThemedCard>
      )}

      {!selectedProjectId && !projectsLoading && (
        <ThemedCard>
          <ThemedText variant="secondary">
            {t('admin.features.selectProject')}
          </ThemedText>
        </ThemedCard>
      )}

      <ThemedConfirmDialog
        isOpen={!!confirm}
        onClose={() => setConfirm(null)}
        onConfirm={handleStatusChange}
        title={
          confirm?.nextStatus === 'archived'
            ? t('features.archiveTitle')
            : t('admin.features.restoreTitle')
        }
        message={
          confirm?.nextStatus === 'archived'
            ? t('features.archiveMessage', { name: confirm?.name ?? '' })
            : t('admin.features.restoreMessage', { name: confirm?.name ?? '' })
        }
        confirmText={
          confirm?.nextStatus === 'archived'
            ? t('tribes.archive')
            : t('admin.features.restore')
        }
        variant={confirm?.nextStatus === 'archived' ? 'warning' : 'info'}
        isLoading={actioning}
      />
    </AppLayout>
  );
}

export const AdminFeaturesPage: React.FC = () => (
  <ThemeProvider defaultTheme={adminMainThemeId}>
    <FeaturesPageContent />
  </ThemeProvider>
);
