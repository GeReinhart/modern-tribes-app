import { ThemedButton } from '@/platform/layout/themes/components/ThemedButton.tsx';
import { ThemedInput } from '@/platform/layout/themes/components/ThemedInput.tsx';
import { ThemedSelect } from '@/platform/layout/themes/components/ThemedSelect.tsx';
import { ThemedCard } from '@/platform/layout/themes/components/ThemedCard';
import { ThemedLoadingSpinner } from '@/platform/layout/themes/components/ThemedLoadingSpinner';
import { ThemedText } from '@/platform/layout/themes/components/ThemedText';
import {
  AdminNavigation,
  adminMainThemeId,
} from '@/platform/layout/AdminNavigation';
import { AppLayout } from '@/platform/layout/AppLayout';
import { ThemeProvider, useTheme } from '@/platform/layout/themes/ThemeContext.tsx';
import { useDocuments } from '@/hooks/useDocuments';
import { usePersons } from '@/hooks/usePersons';
import { usePositionsByTribe } from '@/hooks/usePositions';
import { useProjects } from '@/hooks/useProjects';
import {
  useTribe,
  useTribeMutations,
  useTribeProjects,
} from '@/hooks/useTribes';
import { positionService } from '@/services/position.service';
import { tribeService } from '@/services/tribe.service';
import { PositionEnum } from '@/types/position.types';
import {
  TribeCreate,
  TribeProjectInput,
  TribeProjectRelation,
  TribeUpdate,
} from '@/types/tribe.types';

import React, {
  useCallback,
  useEffect,
  useMemo,
  useRef,
  useState,
} from 'react';
import { useTranslation } from 'react-i18next';
import { useNavigate, useParams } from 'react-router-dom';

// ─── Types ────────────────────────────────────────────────────────────────────

type PersonPositionEntry = { person_id: string; position: PositionEnum };

// ─── Constants ────────────────────────────────────────────────────────────────

const RELATION_OPTIONS: Array<{ value: TribeProjectRelation; label: string }> =
  [
    { value: 'manager', label: 'Manager' },
    { value: 'member', label: 'Member' },
    { value: 'guest', label: 'Guest' },
  ];

const RELATION_COLORS: Record<TribeProjectRelation, string> = {
  manager: '#9333ea',
  member: '#2563eb',
  guest: '#16a34a',
};

const POSITION_OPTIONS: Array<{ value: PositionEnum; label: string }> = [
  { value: 'manager', label: 'Manager' },
  { value: 'member', label: 'Member' },
  { value: 'guest', label: 'Guest' },
];

const POSITION_COLORS: Record<PositionEnum, string> = {
  manager: '#d97706',
  member: '#2563eb',
  guest: '#6b7280',
};

// ─── Section: Project Relations ───────────────────────────────────────────────

interface ProjectSectionProps {
  projects: Array<{ id: string; name: string }>;
  projectRows: TribeProjectInput[];
  onChange: (rows: TribeProjectInput[]) => void;
}

const ProjectRelationsSection: React.FC<ProjectSectionProps> = ({
  projects,
  projectRows,
  onChange,
}) => {
  const { theme } = useTheme();
  const [filter, setFilter] = useState('');
  const [showOnlySelected, setShowOnlySelected] = useState(true);

  const filtered = useMemo(() => {
    let list = projects;
    if (showOnlySelected)
      list = list.filter((p) => projectRows.some((r) => r.project_id === p.id));
    if (filter.trim()) {
      const term = filter.toLowerCase();
      list = list.filter((p) => p.name.toLowerCase().includes(term));
    }
    return list;
  }, [projects, filter, showOnlySelected, projectRows]);

  const toggle = useCallback(
    (projectId: string) => {
      const exists = projectRows.find((r) => r.project_id === projectId);
      if (exists)
        onChange(projectRows.filter((r) => r.project_id !== projectId));
      else
        onChange([
          ...projectRows,
          { project_id: projectId, relation: 'member' },
        ]);
    },
    [projectRows, onChange],
  );

  const updateRelation = useCallback(
    (projectId: string, relation: string) => {
      onChange(
        projectRows.map((r) =>
          r.project_id === projectId
            ? { ...r, relation: relation as TribeProjectRelation }
            : r,
        ),
      );
    },
    [projectRows, onChange],
  );

  return (
    <div>
      <div
        style={{
          fontSize: '13px',
          fontWeight: 600,
          color: theme.colors.primary,
          marginBottom: '8px',
        }}
      >
        Project relations
      </div>
      <div
        style={{
          display: 'flex',
          gap: '8px',
          alignItems: 'center',
          marginBottom: '6px',
        }}
      >
        <div style={{ flex: 1 }}>
          <ThemedInput
            label=""
            value={filter}
            onChange={(e) => setFilter(e.target.value)}
            placeholder="Filter projects..."
            variant="primary"
          />
        </div>
        <label
          style={{
            display: 'flex',
            alignItems: 'center',
            gap: '6px',
            fontSize: '12px',
            color: theme.colors.text,
            cursor: 'pointer',
            whiteSpace: 'nowrap',
            userSelect: 'none',
          }}
        >
          <input
            type="checkbox"
            checked={showOnlySelected}
            onChange={(e) => setShowOnlySelected(e.target.checked)}
            style={{
              width: '14px',
              height: '14px',
              cursor: 'pointer',
              accentColor: theme.colors.primary,
            }}
          />
          Selected ({projectRows.length})
        </label>
      </div>
      <div
        style={{
          maxHeight: '220px',
          overflowY: 'auto',
          display: 'flex',
          flexDirection: 'column',
          gap: '4px',
          paddingRight: '2px',
        }}
      >
        {filtered.length === 0 && (
          <div
            style={{
              fontSize: '13px',
              color: theme.colors.secondary,
              padding: '8px 0',
            }}
          >
            {showOnlySelected ? 'No projects selected' : 'No projects found'}
          </div>
        )}
        {filtered.map((project) => {
          const row = projectRows.find((r) => r.project_id === project.id);
          const isSelected = !!row;
          const color = row
            ? RELATION_COLORS[row.relation]
            : theme.colors.primary;
          return (
            <div
              key={project.id}
              onClick={() => toggle(project.id)}
              style={{
                display: 'flex',
                alignItems: 'center',
                gap: '10px',
                padding: '8px 12px',
                borderRadius: '8px',
                border: `2px solid ${isSelected ? color : theme.colors.primary + '25'}`,
                background: isSelected
                  ? `${color}12`
                  : `${theme.colors.primary}05`,
                cursor: 'pointer',
                transition: 'all 0.15s',
              }}
            >
              <input
                type="checkbox"
                checked={isSelected}
                readOnly
                style={{
                  width: '15px',
                  height: '15px',
                  cursor: 'pointer',
                  accentColor: color,
                  flexShrink: 0,
                }}
              />
              <span
                style={{ fontSize: '13px', color: theme.colors.text, flex: 1 }}
              >
                {project.name}
              </span>
              {isSelected && (
                <div onClick={(e) => e.stopPropagation()}>
                  <select
                    value={row!.relation}
                    onChange={(e) => updateRelation(project.id, e.target.value)}
                    style={{
                      padding: '2px 8px',
                      borderRadius: '6px',
                      border: `1.5px solid ${color}`,
                      background: `${color}15`,
                      color,
                      fontSize: '12px',
                      fontWeight: 600,
                      cursor: 'pointer',
                      outline: 'none',
                    }}
                  >
                    {RELATION_OPTIONS.map((opt) => (
                      <option key={opt.value} value={opt.value}>
                        {opt.label}
                      </option>
                    ))}
                  </select>
                </div>
              )}
            </div>
          );
        })}
      </div>
    </div>
  );
};

// ─── Section: Person Positions ────────────────────────────────────────────────

interface PersonSectionProps {
  persons: Array<{ id: string; first_name: string; last_name: string }>;
  personPositions: PersonPositionEntry[];
  onChange: (entries: PersonPositionEntry[]) => void;
}

const PersonPositionsSection: React.FC<PersonSectionProps> = ({
  persons,
  personPositions,
  onChange,
}) => {
  const { theme } = useTheme();
  const [filter, setFilter] = useState('');
  const [showOnlySelected, setShowOnlySelected] = useState(true);

  const filtered = useMemo(() => {
    let list = persons;
    if (showOnlySelected)
      list = list.filter((p) =>
        personPositions.some((e) => e.person_id === p.id),
      );
    if (filter.trim()) {
      const term = filter.toLowerCase();
      list = list.filter((p) =>
        `${p.first_name} ${p.last_name}`.toLowerCase().includes(term),
      );
    }
    return list;
  }, [persons, filter, showOnlySelected, personPositions]);

  const toggle = useCallback(
    (personId: string) => {
      const exists = personPositions.find((e) => e.person_id === personId);
      if (exists)
        onChange(personPositions.filter((e) => e.person_id !== personId));
      else
        onChange([
          ...personPositions,
          { person_id: personId, position: 'member' },
        ]);
    },
    [personPositions, onChange],
  );

  const updatePosition = useCallback(
    (personId: string, position: string) => {
      onChange(
        personPositions.map((e) =>
          e.person_id === personId
            ? { ...e, position: position as PositionEnum }
            : e,
        ),
      );
    },
    [personPositions, onChange],
  );

  return (
    <div>
      <div
        style={{
          fontSize: '13px',
          fontWeight: 600,
          color: theme.colors.primary,
          marginBottom: '8px',
        }}
      >
        Members &amp; positions
      </div>
      <div
        style={{
          display: 'flex',
          gap: '8px',
          alignItems: 'center',
          marginBottom: '6px',
        }}
      >
        <div style={{ flex: 1 }}>
          <ThemedInput
            label=""
            value={filter}
            onChange={(e) => setFilter(e.target.value)}
            placeholder="Filter persons..."
            variant="primary"
          />
        </div>
        <label
          style={{
            display: 'flex',
            alignItems: 'center',
            gap: '6px',
            fontSize: '12px',
            color: theme.colors.text,
            cursor: 'pointer',
            whiteSpace: 'nowrap',
            userSelect: 'none',
          }}
        >
          <input
            type="checkbox"
            checked={showOnlySelected}
            onChange={(e) => setShowOnlySelected(e.target.checked)}
            style={{
              width: '14px',
              height: '14px',
              cursor: 'pointer',
              accentColor: theme.colors.primary,
            }}
          />
          Selected ({personPositions.length})
        </label>
      </div>
      <div
        style={{
          maxHeight: '240px',
          overflowY: 'auto',
          display: 'flex',
          flexDirection: 'column',
          gap: '4px',
          paddingRight: '2px',
        }}
      >
        {filtered.length === 0 && (
          <div
            style={{
              fontSize: '13px',
              color: theme.colors.secondary,
              padding: '8px 0',
            }}
          >
            {showOnlySelected ? 'No members yet' : 'No persons found'}
          </div>
        )}
        {filtered.map((person) => {
          const entry = personPositions.find((e) => e.person_id === person.id);
          const isSelected = !!entry;
          const color = entry
            ? POSITION_COLORS[entry.position]
            : theme.colors.primary;
          return (
            <div
              key={person.id}
              onClick={() => toggle(person.id)}
              style={{
                display: 'flex',
                alignItems: 'center',
                gap: '10px',
                padding: '8px 12px',
                borderRadius: '8px',
                border: `2px solid ${isSelected ? color : theme.colors.primary + '25'}`,
                background: isSelected
                  ? `${color}12`
                  : `${theme.colors.primary}05`,
                cursor: 'pointer',
                transition: 'all 0.15s',
              }}
            >
              <input
                type="checkbox"
                checked={isSelected}
                readOnly
                style={{
                  width: '15px',
                  height: '15px',
                  cursor: 'pointer',
                  accentColor: color,
                  flexShrink: 0,
                }}
              />
              <span
                style={{ fontSize: '13px', color: theme.colors.text, flex: 1 }}
              >
                {person.first_name} {person.last_name}
              </span>
              {isSelected && (
                <div onClick={(e) => e.stopPropagation()}>
                  <select
                    value={entry!.position}
                    onChange={(e) => updatePosition(person.id, e.target.value)}
                    style={{
                      padding: '2px 8px',
                      borderRadius: '6px',
                      border: `1.5px solid ${color}`,
                      background: `${color}15`,
                      color,
                      fontSize: '12px',
                      fontWeight: 600,
                      cursor: 'pointer',
                      outline: 'none',
                    }}
                  >
                    {POSITION_OPTIONS.map((opt) => (
                      <option key={opt.value} value={opt.value}>
                        {opt.label}
                      </option>
                    ))}
                  </select>
                </div>
              )}
            </div>
          );
        })}
      </div>
    </div>
  );
};

// ─── Page ─────────────────────────────────────────────────────────────────────

const TribeEditPageContent: React.FC = () => {
  const { tribeId } = useParams<{ tribeId?: string }>();
  const navigate = useNavigate();
  const { t } = useTranslation();
  const isCreate = !tribeId;

  const { tribe, loading: tribeLoading } = useTribe(tribeId ?? null);
  const { tribeProjects, hasFetched: projectsFetched } = useTribeProjects(
    tribeId ?? null,
  );
  const { positions: existingPositions, hasFetched: positionsFetched } =
    usePositionsByTribe(tribeId ?? null);
  const { projects } = useProjects();
  const { persons } = usePersons();
  const { documents } = useDocuments();
  const { createTribe, updateTribe } = useTribeMutations();

  const [formData, setFormData] = useState<{
    name: string;
    document_id: string | null;
  }>({ name: '', document_id: null });
  const [status, setStatus] = useState('active');
  const [projectRows, setProjectRows] = useState<TribeProjectInput[]>([]);
  const [personPositions, setPersonPositions] = useState<PersonPositionEntry[]>(
    [],
  );
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const projectsInitialized = useRef(false);
  const positionsInitialized = useRef(false);

  useEffect(() => {
    if (tribe) {
      setFormData({ name: tribe.name, document_id: tribe.document_id ?? null });
      setStatus(tribe.status ?? 'active');
    }
  }, [tribe]);

  // hasFetched is false until the API responds (or immediately true for create mode).
  // This avoids the useApi loading=false initial-state race where the effect fires
  // before any fetch has started and locks the ref with empty data.
  useEffect(() => {
    if (!projectsInitialized.current && projectsFetched) {
      setProjectRows(
        tribeProjects.map((tp) => ({
          project_id: tp.project_id,
          relation: tp.relation as TribeProjectRelation,
        })),
      );
      projectsInitialized.current = true;
    }
  }, [tribeProjects, projectsFetched]); // eslint-disable-line react-hooks/exhaustive-deps

  useEffect(() => {
    if (!positionsInitialized.current && positionsFetched) {
      setPersonPositions(
        existingPositions.map((p) => ({
          person_id: p.person_id!,
          // Normalize legacy 'chief' value (pre-migration compat)
          position: (p.position as string) === 'chief' ? 'manager' : p.position,
        })),
      );
      positionsInitialized.current = true;
    }
  }, [existingPositions, positionsFetched]); // eslint-disable-line react-hooks/exhaustive-deps

  // Call positionService directly — avoids shared-execute stale issues from hooks
  const syncPositions = useCallback(
    async (savedTribeId: string) => {
      if (isCreate) {
        for (const entry of personPositions) {
          await positionService.create({
            tribe_id: savedTribeId,
            person_id: entry.person_id,
            position: entry.position,
          });
        }
        return;
      }
      const existingMap = new Map(
        existingPositions.map((p) => [p.person_id!, p]),
      );
      const newIds = new Set(personPositions.map((e) => e.person_id));
      for (const entry of personPositions) {
        const existing = existingMap.get(entry.person_id);
        if (!existing) {
          await positionService.create({
            tribe_id: savedTribeId,
            person_id: entry.person_id,
            position: entry.position,
          });
        } else if (existing.position !== entry.position) {
          await positionService.update(existing.id, {
            position: entry.position,
          });
        }
      }
      for (const existing of existingPositions) {
        if (existing.person_id && !newIds.has(existing.person_id)) {
          await positionService.delete(existing.id);
        }
      }
    },
    [isCreate, personPositions, existingPositions],
  );

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setSaving(true);
    setError(null);
    try {
      let savedId: string;
      if (isCreate) {
        const created = await createTribe(formData as TribeCreate);
        if (!created) throw new Error('Failed to create tribe');
        savedId = created.id;
      } else {
        const updated = await updateTribe(tribeId!, {
          ...formData,
          status,
        } as TribeUpdate);
        if (!updated) throw new Error('Failed to update tribe');
        savedId = updated.id;
      }
      await tribeService.syncTribeProjects(savedId, projectRows);
      await syncPositions(savedId);
      navigate('/admin/tribes');
    } catch (err: unknown) {
      setError(err instanceof Error ? err.message : 'An error occurred');
    } finally {
      setSaving(false);
    }
  };

  const breadcrumbs = useMemo(
    () => [
      { label: t('common.home'), path: '/app' },
      { label: t('common.admin'), path: '/admin' },
      { label: t('admin.tribes'), path: '/admin/tribes' },
      { label: isCreate ? t('admin.addTribe') : t('admin.editTribe') },
    ],
    [t, isCreate],
  );

  const headerActions = <AdminNavigation currentPage="tribes" />;

  // !projectsFetched and !positionsFetched catch the window where loading=false
  // but the fetch hasn't started yet (useApi initializes loading=false).
  const isLoading =
    !isCreate && (tribeLoading || !projectsFetched || !positionsFetched);

  if (isLoading)
    return (
      <AppLayout breadcrumbs={breadcrumbs} headerActions={headerActions}>
        <div
          style={{ display: 'flex', justifyContent: 'center', padding: '48px' }}
        >
          <ThemedLoadingSpinner size="sm" />
        </div>
      </AppLayout>
    );

  if (!isCreate && !tribe)
    return (
      <AppLayout breadcrumbs={breadcrumbs} headerActions={headerActions}>
        <ThemedCard variant="danger">
          <ThemedText variant="danger">{t('admin.tribeNotFound')}</ThemedText>
        </ThemedCard>
      </AppLayout>
    );

  const documentOptions = [
    { value: '', label: 'None' },
    ...documents.map((d) => ({
      value: d.id,
      label: d.content_summary
        ? `${d.content_summary} (${d.id.slice(0, 8)})`
        : d.id.slice(0, 8),
    })),
  ];

  const statusOptions = [
    { value: 'active', label: 'Active' },
    { value: 'pending', label: 'Pending' },
    { value: 'archived', label: 'Archived' },
  ];

  return (
    <AppLayout breadcrumbs={breadcrumbs} headerActions={headerActions}>
      <form onSubmit={handleSubmit}>
        <div style={{ display: 'flex', flexDirection: 'column', gap: '16px' }}>
          {error && (
            <ThemedCard variant="danger">
              <ThemedText variant="danger">{error}</ThemedText>
            </ThemedCard>
          )}

          <ThemedCard>
            <ThemedText
              variant="primary"
              size="medium"
              as="h3"
              style={{ marginBottom: '16px' }}
            >
              {t('admin.tribeInfo')}
            </ThemedText>
            <div
              style={{ display: 'flex', flexDirection: 'column', gap: '12px' }}
            >
              <ThemedInput
                label="Name"
                value={formData.name}
                onChange={(e) =>
                  setFormData((p) => ({ ...p, name: e.target.value }))
                }
                required
              />
              <ThemedSelect
                label="Document"
                value={formData.document_id || ''}
                onChange={(v) =>
                  setFormData((p) => ({ ...p, document_id: v || null }))
                }
                options={documentOptions}
              />
              {!isCreate && (
                <ThemedSelect
                  label="Status"
                  value={status}
                  onChange={setStatus}
                  options={statusOptions}
                  allowEmpty={false}
                />
              )}
            </div>
          </ThemedCard>

          <ThemedCard>
            <ProjectRelationsSection
              projects={projects}
              projectRows={projectRows}
              onChange={setProjectRows}
            />
          </ThemedCard>

          <ThemedCard>
            <PersonPositionsSection
              persons={persons}
              personPositions={personPositions}
              onChange={setPersonPositions}
            />
          </ThemedCard>

          <div
            style={{ display: 'flex', gap: '12px', justifyContent: 'flex-end' }}
          >
            <ThemedButton
              type="button"
              variant="ghost"
              onClick={() => navigate('/admin/tribes')}
            >
              {t('common.cancel')}
            </ThemedButton>
            <ThemedButton type="submit" variant="primary" isLoading={saving}>
              {isCreate ? t('admin.addTribe') : t('common.save')}
            </ThemedButton>
          </div>
        </div>
      </form>
    </AppLayout>
  );
};

export const TribeEditPage: React.FC = () => (
  <ThemeProvider defaultTheme={adminMainThemeId}>
    <TribeEditPageContent />
  </ThemeProvider>
);
