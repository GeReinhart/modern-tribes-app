import { ThemedButton } from '@/app/platform/core/layout/themes/components/ThemedButton.tsx';
import { ThemedSvgIcon } from '@/app/platform/core/layout/themes/icons/ThemedSvgIcon.tsx';
import { ThemedInput } from '@/app/platform/core/layout/themes/components/ThemedInput.tsx';
import { ThemedSelect } from '@/app/platform/core/layout/themes/components/ThemedSelect.tsx';
import { StatusBadge } from '@/app/platform/core/layout/themes/components/StatusBadge.tsx';
import { ThemedCard } from '@/app/platform/core/layout/themes/components/ThemedCard.tsx';
import { ThemedConfirmDialog } from '@/app/platform/core/layout/themes/components/ThemedConfirmDialog.tsx';
import { ThemedLoadingSpinner } from '@/app/platform/core/layout/themes/components/ThemedLoadingSpinner.tsx';
import {
  ThemedModal,
  ThemedModalBody,
} from '@/app/platform/core/layout/themes/components/ThemedModal.tsx';
import { ThemedTable } from '@/app/platform/core/layout/themes/components/ThemedTable.tsx';
import { ThemedTabs } from '@/app/platform/core/layout/themes/components/ThemedTabs.tsx';
import { ThemedText } from '@/app/platform/core/layout/themes/components/ThemedText.tsx';
import { ProjectModal } from '@/app/features/tribes-projects/projects/ProjectModal.tsx';
import {
  AdminNavigation,
  adminMainThemeId,
} from '@/app/platform/core/layout/AdminNavigation.tsx';
import { AppLayout } from '@/app/platform/core/layout/AppLayout.tsx';
import { ThemeProvider, useTheme } from '@/app/platform/core/layout/themes/ThemeContext.tsx';
import { useAdminAccess } from '@/app/platform/core/authorization/useAdminAccess.ts';
import { useCrudPage } from '@/app/platform/functions/documents/useCrudPage.ts';
import { usePersons } from '@/app/platform/functions/people/persons/usePersons.ts';
import { usePositions } from '@/app/features/tribes-projects/positions/usePositions.ts';
import { useProjectMutations, useProjects } from '@/app/features/tribes-projects/projects/useProjects.ts';
import { useTribeMutations, useTribes } from '@/app/features/tribes-projects/tribes/useTribes.ts';
import { Project, ProjectCreate, ProjectUpdate } from '@/app/features/tribes-projects/projects/project.types.ts';
import { Tribe, TribeCreate, TribeUpdate } from '@/app/features/tribes-projects/tribes/tribe.types.ts';

import React, { useMemo, useState } from 'react';
import { useTranslation } from 'react-i18next';
import { Navigate, useNavigate } from 'react-router-dom';

const POSITION_COLORS: Record<string, string> = {
  manager: '#d97706',
  member: '#2563eb',
  guest: '#6b7280',
};

// ─── Tribes Tab ──────────────────────────────────────────────────────────────

type TribePersonEntry = { personId: string; position: string };

interface TribesTabProps {
  canWrite: boolean;
}

const TribesTab: React.FC<TribesTabProps> = ({ canWrite }) => {
  const { t } = useTranslation();
  const { theme } = useTheme();
  const navigate = useNavigate();
  const { tribes, loading, error, refetch } = useTribes();
  const { deleteTribe, loading: mutationLoading } = useTribeMutations();
  const crud = useCrudPage<Tribe, TribeCreate, TribeUpdate>(
    refetch,
    async () => undefined,
    async () => undefined,
    deleteTribe,
  );

  const { positions } = usePositions();
  const { persons } = usePersons();

  const tribePositions = useMemo(() => {
    const map = new Map<string, TribePersonEntry[]>();
    for (const pos of positions) {
      if (!pos.tribe_id || !pos.person_id || pos.status !== 'active') continue;
      if (!map.has(pos.tribe_id)) map.set(pos.tribe_id, []);
      map
        .get(pos.tribe_id)!
        .push({ personId: pos.person_id, position: pos.position });
    }
    return map;
  }, [positions]);

  const personById = useMemo(
    () => new Map(persons.map((p) => [p.id, p])),
    [persons],
  );

  const [personFilter, setPersonFilter] = useState('');
  const [membersPopupTribeId, setMembersPopupTribeId] = useState<string | null>(
    null,
  );

  const filteredTribes = useMemo(() => {
    let list = tribes;
    if (crud.filter.trim()) {
      const term = crud.filter.toLowerCase();
      list = list.filter((tr) => tr.name.toLowerCase().includes(term));
    }
    if (personFilter) {
      list = list.filter((tr) =>
        tribePositions.get(tr.id)?.some((e) => e.personId === personFilter),
      );
    }
    return list;
  }, [tribes, crud.filter, personFilter, tribePositions]);

  const personOptions = useMemo(
    () => [
      { value: '', label: t('admin.allPersons') },
      ...persons
        .slice()
        .sort((a, b) =>
          `${a.first_name} ${a.last_name}`.localeCompare(
            `${b.first_name} ${b.last_name}`,
          ),
        )
        .map((p) => ({ value: p.id, label: `${p.first_name} ${p.last_name}` })),
    ],
    [persons, t],
  );

  const popupTribe = useMemo(
    () =>
      membersPopupTribeId
        ? tribes.find((tr) => tr.id === membersPopupTribeId)
        : null,
    [membersPopupTribeId, tribes],
  );
  const popupMembers = useMemo(
    () =>
      membersPopupTribeId
        ? (tribePositions.get(membersPopupTribeId) ?? [])
        : [],
    [membersPopupTribeId, tribePositions],
  );

  const columns = useMemo(
    () => [
      {
        key: 'name',
        header: t('common.name'),
        render: (tr: Tribe) => <div style={{ fontWeight: 500 }}>{tr.name}</div>,
      },
      {
        key: 'persons',
        header: t('admin.columnPersons'),
        render: (tr: Tribe) => {
          const count = tr.member_count;
          return (
            <button
              onClick={(e) => {
                e.stopPropagation();
                setMembersPopupTribeId(tr.id);
              }}
              style={{
                padding: '2px 10px',
                borderRadius: '12px',
                border: `1.5px solid ${count > 0 ? theme.colors.primary : theme.colors.border}`,
                background:
                  count > 0 ? `${theme.colors.primary}18` : 'transparent',
                color:
                  count > 0 ? theme.colors.primary : theme.colors.secondary,
                fontSize: '12px',
                fontWeight: 600,
                cursor: 'pointer',
              }}
            >
              {count}
            </button>
          );
        },
      },
      {
        key: 'document',
        header: t('admin.columnDocument'),
        render: (tr: Tribe) => (
          <span style={{ fontSize: '12px', color: theme.colors.secondary }}>
            {tr.document_id ? (
              <span style={{ color: theme.colors.primary }}>
                {t('admin.attached')}
              </span>
            ) : (
              t('admin.none')
            )}
          </span>
        ),
      },
      {
        key: 'created_at',
        header: t('common.created'),
        render: (tr: Tribe) => new Date(tr.created_at).toLocaleDateString(),
      },
      {
        key: 'status',
        header: t('monitoring.status'),
        render: (tr: Tribe) => <StatusBadge status={tr.status ?? 'active'} />,
      },
      {
        key: 'actions',
        header: t('common.actions'),
        render: (tr: Tribe) => (
          <div
            style={{ display: 'flex', gap: '8px' }}
            onClick={(e) => e.stopPropagation()}
          >
            <ThemedButton
              variant="secondary"
              onClick={() => navigate(`/admin/tribes/${tr.url_param_id}/edit`)}
              title={t('common.edit')}
              style={{ padding: 'var(--btn-pad-v)' }}
            >
              <ThemedSvgIcon name="pencil" color="currentColor" size={16} />
            </ThemedButton>
            {canWrite && (
              <ThemedButton
                variant="danger"
                onClick={() => crud.openDeleteSingle(tr)}
                title={t('common.delete')}
                style={{ padding: 'var(--btn-pad-v)' }}
              >
                <ThemedSvgIcon name="trash" color="currentColor" size={16} />
              </ThemedButton>
            )}
          </div>
        ),
      },
    ],
    [
      t,
      theme.colors.secondary,
      theme.colors.primary,
      theme.colors.border,
      crud,
      navigate,
      tribePositions,
      canWrite,
    ],
  );

  if (loading)
    return (
      <div
        style={{ display: 'flex', justifyContent: 'center', padding: '48px' }}
      >
        <ThemedLoadingSpinner size="sm" />
      </div>
    );

  return (
    <>
      {error && (
        <ThemedCard variant="danger">
          <ThemedText variant="danger">{error}</ThemedText>
        </ThemedCard>
      )}
      <div style={{ display: 'flex', gap: '8px', marginBottom: '12px' }}>
        {canWrite && (
          <ThemedButton
            variant="secondary"
            onClick={() => navigate('/admin/tribes/new')}
            leftIcon={
              <ThemedSvgIcon name="plus" color="currentColor" size={16} />
            }
          >
            {t('admin.tribe')}
          </ThemedButton>
        )}
        {canWrite && crud.selectedRows.size > 0 && (
          <ThemedButton
            variant="danger"
            onClick={crud.handleDeleteSelected}
            leftIcon={
              <ThemedSvgIcon name="trash" color="currentColor" size={16} />
            }
          >
            {t('admin.deleteSelected', { count: crud.selectedRows.size })}
          </ThemedButton>
        )}
      </div>
      <div style={{ display: 'flex', gap: '12px', alignItems: 'flex-end' }}>
        <div style={{ flex: 1 }}>
          <ThemedInput
            label={t('common.filter')}
            value={crud.filter}
            onChange={(e) => crud.setFilter(e.target.value)}
            placeholder={t('admin.searchName')}
            variant="primary"
          />
        </div>
        <div style={{ flex: 1 }}>
          <ThemedSelect
            label={t('admin.filterByPerson')}
            value={personFilter}
            onChange={setPersonFilter}
            options={personOptions}
            allowEmpty={false}
          />
        </div>
      </div>
      <div style={{ marginTop: '12px' }}>
        <ThemedTable
          data={filteredTribes}
          columns={columns}
          getRowId={(tr) => tr.id}
          onRowClick={(tr) => navigate(`/admin/tribes/${tr.url_param_id}/edit`)}
          selectedRows={canWrite ? crud.selectedRows : undefined}
          onRowSelect={canWrite ? crud.handleRowSelect : undefined}
        />
      </div>
      {canWrite && (
        <ThemedConfirmDialog
          isOpen={crud.deleteDialog.isOpen}
          onClose={crud.closeDeleteDialog}
          onConfirm={crud.confirmDelete}
          title={
            crud.deleteDialog.isMultiple
              ? t('admin.deleteSelectedTribes')
              : t('admin.deleteTribe')
          }
          message={
            crud.deleteDialog.isMultiple
              ? t('admin.confirmDeleteSelected', {
                  count: crud.selectedRows.size,
                })
              : t('admin.confirmDeleteNamed', {
                  name: crud.deleteDialog.entity?.name,
                })
          }
          confirmText={t('common.delete')}
          variant="danger"
          isLoading={mutationLoading}
        />
      )}
      <ThemedModal
        isOpen={!!membersPopupTribeId}
        onClose={() => setMembersPopupTribeId(null)}
        title={popupTribe ? popupTribe.name : ''}
        size="sm"
      >
        <ThemedModalBody>
          {popupMembers.length === 0 ? (
            <ThemedText variant="secondary" size="small">
              {t('admin.noTribeMembers')}
            </ThemedText>
          ) : (
            <div
              style={{ display: 'flex', flexDirection: 'column', gap: '10px' }}
            >
              {popupMembers.map((entry) => {
                const person = personById.get(entry.personId);
                return (
                  <div
                    key={entry.personId}
                    style={{
                      display: 'flex',
                      justifyContent: 'space-between',
                      alignItems: 'center',
                    }}
                  >
                    <ThemedText variant="text" size="small">
                      {person
                        ? `${person.first_name} ${person.last_name}`
                        : entry.personId}
                    </ThemedText>
                    <span
                      style={{
                        padding: '2px 8px',
                        borderRadius: '10px',
                        backgroundColor:
                          POSITION_COLORS[entry.position] ?? '#6b7280',
                        color: 'white',
                        fontSize: '11px',
                        fontWeight: 600,
                        textTransform: 'uppercase',
                      }}
                    >
                      {t(`positions.${entry.position}`)}
                    </span>
                  </div>
                );
              })}
            </div>
          )}
        </ThemedModalBody>
      </ThemedModal>
    </>
  );
};

// ─── Projects Tab ─────────────────────────────────────────────────────────────

const ProjectsTab: React.FC = () => {
  const { t } = useTranslation();
  const { theme } = useTheme();
  const { projects, loading, error, refetch } = useProjects();
  const {
    createProject,
    updateProject,
    deleteProject,
    loading: mutationLoading,
  } = useProjectMutations();
  const crud = useCrudPage<Project, ProjectCreate, ProjectUpdate>(
    refetch,
    createProject,
    updateProject,
    deleteProject,
  );

  const filteredProjects = useMemo(() => {
    if (!crud.filter.trim()) return projects;
    const term = crud.filter.toLowerCase();
    return projects.filter((p) => p.name.toLowerCase().includes(term));
  }, [projects, crud.filter]);

  const columns = useMemo(
    () => [
      {
        key: 'name',
        header: t('common.name'),
        render: (p: Project) => <div style={{ fontWeight: 500 }}>{p.name}</div>,
      },
      {
        key: 'document',
        header: t('admin.columnDocument'),
        render: (p: Project) => (
          <span style={{ fontSize: '12px', color: theme.colors.secondary }}>
            {p.document_id ? (
              <span style={{ color: theme.colors.primary }}>
                {t('admin.attached')}
              </span>
            ) : (
              t('admin.none')
            )}
          </span>
        ),
      },
      {
        key: 'created_at',
        header: t('common.created'),
        render: (p: Project) => new Date(p.created_at).toLocaleDateString(),
      },
      {
        key: 'status',
        header: t('monitoring.status'),
        render: (p: Project) => <StatusBadge status={p.status ?? 'active'} />,
      },
      {
        key: 'actions',
        header: t('common.actions'),
        render: (p: Project) => (
          <div
            style={{ display: 'flex', gap: '8px' }}
            onClick={(e) => e.stopPropagation()}
          >
            <ThemedButton
              variant="secondary"
              onClick={() => crud.openEdit(p)}
              title={t('common.edit')}
              style={{ padding: 'var(--btn-pad-v)' }}
            >
              <ThemedSvgIcon name="pencil" color="currentColor" size={16} />
            </ThemedButton>
            <ThemedButton
              variant="danger"
              onClick={() => crud.openDeleteSingle(p)}
              title={t('common.delete')}
              style={{ padding: 'var(--btn-pad-v)' }}
            >
              <ThemedSvgIcon name="trash" color="currentColor" size={16} />
            </ThemedButton>
          </div>
        ),
      },
    ],
    [t, theme.colors.secondary, theme.colors.primary, crud],
  );

  if (loading)
    return (
      <div
        style={{ display: 'flex', justifyContent: 'center', padding: '48px' }}
      >
        <ThemedLoadingSpinner size="sm" />
      </div>
    );

  return (
    <>
      {error && (
        <ThemedCard variant="danger">
          <ThemedText variant="danger">{error}</ThemedText>
        </ThemedCard>
      )}
      <div style={{ display: 'flex', gap: '8px', marginBottom: '12px' }}>
        <ThemedButton
          variant="secondary"
          onClick={crud.openCreate}
          leftIcon={
            <ThemedSvgIcon name="plus" color="currentColor" size={16} />
          }
        >
          {t('common.project')}
        </ThemedButton>
        {crud.selectedRows.size > 0 && (
          <ThemedButton
            variant="danger"
            onClick={crud.handleDeleteSelected}
            leftIcon={
              <ThemedSvgIcon name="trash" color="currentColor" size={16} />
            }
          >
            {t('admin.deleteSelected', { count: crud.selectedRows.size })}
          </ThemedButton>
        )}
      </div>
      <ThemedInput
        label={t('common.filter')}
        value={crud.filter}
        onChange={(e) => crud.setFilter(e.target.value)}
        placeholder={t('admin.searchName')}
        variant="primary"
      />
      <div style={{ marginTop: '12px' }}>
        <ThemedTable
          data={filteredProjects}
          columns={columns}
          getRowId={(p) => p.id}
          onRowClick={(p) => crud.openView(p)}
          selectedRows={crud.selectedRows}
          onRowSelect={crud.handleRowSelect}
        />
      </div>
      <ProjectModal
        isOpen={crud.modalState.isOpen}
        onClose={crud.closeModal}
        project={crud.modalState.entity}
        mode={crud.modalState.mode}
        onSubmit={crud.handleSubmit}
      />
      <ThemedConfirmDialog
        isOpen={crud.deleteDialog.isOpen}
        onClose={crud.closeDeleteDialog}
        onConfirm={crud.confirmDelete}
        title={
          crud.deleteDialog.isMultiple
            ? t('admin.deleteSelectedProjects')
            : t('admin.deleteProject')
        }
        message={
          crud.deleteDialog.isMultiple
            ? t('admin.confirmDeleteSelected', {
                count: crud.selectedRows.size,
              })
            : t('admin.confirmDeleteNamed', {
                name: crud.deleteDialog.entity?.name,
              })
        }
        confirmText={t('common.delete')}
        variant="danger"
        isLoading={mutationLoading}
      />
    </>
  );
};

// ─── Main Page ────────────────────────────────────────────────────────────────

type TabKey = 'tribes' | 'projects';

const TribesProjectsPageContent: React.FC = () => {
  const { t } = useTranslation();
  const { isAdmin, hasAdminAccess, isLoading } = useAdminAccess();
  const [activeTab, setActiveTab] = useState<TabKey>('tribes');

  const breadcrumbs = useMemo(
    () => [
      { label: t('common.home'), path: '/app' },
      { label: t('common.admin'), path: '/admin' },
      { label: t('admin.tribes') },
    ],
    [t],
  );

  const tabs = useMemo(() => {
    const result = [{ key: 'tribes', label: t('admin.tribes') }];
    if (isAdmin) result.push({ key: 'projects', label: t('admin.projects') });
    return result;
  }, [t, isAdmin]);

  const headerActions = <AdminNavigation currentPage="tribes" />;

  if (!isLoading && !hasAdminAccess) {
    return <Navigate to="/app" replace />;
  }

  return (
    <AppLayout breadcrumbs={breadcrumbs} headerActions={headerActions}>
      <ThemedCard>
        <ThemedTabs
          tabs={tabs}
          activeTab={activeTab}
          onTabChange={(k) => setActiveTab(k as TabKey)}
        />
        <div style={{ marginTop: '16px' }}>
          <div style={{ display: activeTab === 'tribes' ? 'block' : 'none' }}>
            <TribesTab canWrite={isAdmin} />
          </div>
          {isAdmin && (
            <div style={{ display: activeTab === 'projects' ? 'block' : 'none' }}>
              <ProjectsTab />
            </div>
          )}
        </div>
      </ThemedCard>
    </AppLayout>
  );
};

export const AdminTribesProjectsPage: React.FC = () => (
  <ThemeProvider defaultTheme={adminMainThemeId}>
    <TribesProjectsPageContent />
  </ThemeProvider>
);
