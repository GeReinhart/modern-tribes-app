import { ThemedButton } from '@/platform/layout/themes/components/ThemedButton.tsx';
import { ThemedInput } from '@/platform/layout/themes/components/ThemedInput.tsx';
import { ThemedSelect } from '@/platform/layout/themes/components/ThemedSelect.tsx';
import { useTheme } from '@/platform/layout/themes/ThemeContext.tsx';
import { useDocuments } from '@/hooks/useDocuments.ts';
import { useProjects } from '@/hooks/useProjects.ts';
import { useTribeProjects } from '@/hooks/useTribes.ts';
import { FormMode } from '@/types/common.types.ts';
import {
  Tribe,
  TribeCreate,
  TribeProjectInput,
  TribeProjectRelation,
  TribeUpdate,
} from '@/types/tribe.types.ts';

import React, {
  useCallback,
  useEffect,
  useMemo,
  useRef,
  useState,
} from 'react';

interface TribeFormProps {
  tribe?: Tribe;
  mode: FormMode;
  onSubmit: (
    data: TribeCreate | TribeUpdate,
    projects: TribeProjectInput[],
  ) => Promise<void>;
  onCancel: () => void;
}

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

export const TribeForm: React.FC<TribeFormProps> = ({
  tribe,
  mode,
  onSubmit,
  onCancel,
}) => {
  const { theme } = useTheme();
  const { documents } = useDocuments();
  const { projects } = useProjects();
  const { tribeProjects } = useTribeProjects(tribe?.id ?? null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const [formData, setFormData] = useState<TribeCreate>({
    name: '',
    document_id: null,
  });
  const [status, setStatus] = useState(tribe?.status ?? 'active');

  const [projectRows, setProjectRows] = useState<TribeProjectInput[]>([]);
  const [projectFilter, setProjectFilter] = useState('');
  const [showOnlySelected, setShowOnlySelected] = useState(false);
  const projectsInitialized = useRef(false);

  useEffect(() => {
    if (tribe && mode !== 'create') {
      setFormData({ name: tribe.name, document_id: tribe.document_id || null });
      setStatus(tribe.status ?? 'active');
    }
  }, [tribe, mode]);

  useEffect(() => {
    if (!projectsInitialized.current && tribeProjects.length > 0) {
      setProjectRows(
        tribeProjects.map((tp) => ({
          project_id: tp.project_id,
          relation: tp.relation as TribeProjectRelation,
        })),
      );
      setShowOnlySelected(true);
      projectsInitialized.current = true;
    }
  }, [tribeProjects]);

  const filteredProjects = useMemo(() => {
    let list = projects;
    if (showOnlySelected)
      list = list.filter((p) => projectRows.some((r) => r.project_id === p.id));
    if (projectFilter.trim()) {
      const term = projectFilter.toLowerCase();
      list = list.filter((p) => p.name.toLowerCase().includes(term));
    }
    return list;
  }, [projects, projectFilter, showOnlySelected, projectRows]);

  const toggleProject = useCallback((projectId: string) => {
    setProjectRows((prev) => {
      const exists = prev.find((r) => r.project_id === projectId);
      if (exists) return prev.filter((r) => r.project_id !== projectId);
      return [...prev, { project_id: projectId, relation: 'member' }];
    });
  }, []);

  const updateRelation = useCallback((projectId: string, relation: string) => {
    setProjectRows((prev) =>
      prev.map((r) =>
        r.project_id === projectId
          ? { ...r, relation: relation as TribeProjectRelation }
          : r,
      ),
    );
  }, []);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    setError(null);
    try {
      await onSubmit(
        mode === 'create' ? formData : { ...formData, status },
        projectRows,
      );
    } catch (err: unknown) {
      setError(err instanceof Error ? err.message : 'An error occurred');
    } finally {
      setLoading(false);
    }
  };

  const isReadOnly = mode === 'view';

  const documentOptions = [
    { value: '', label: 'None' },
    ...documents.map((doc) => ({
      value: doc.id,
      label: doc.content_summary
        ? `${doc.content_summary} (${doc.id})`
        : doc.id,
    })),
  ];

  const statusOptions = [
    { value: 'active', label: 'Active' },
    { value: 'pending', label: 'Pending' },
    { value: 'archived', label: 'Archived' },
  ];

  return (
    <form onSubmit={handleSubmit} className="space-y-4">
      {error && (
        <div className="bg-red-50 text-red-600 p-3 rounded-md text-sm">
          {error}
        </div>
      )}

      <ThemedInput
        label="Name"
        value={formData.name}
        onChange={(e) => setFormData({ ...formData, name: e.target.value })}
        required
        disabled={isReadOnly}
      />

      <ThemedSelect
        label="Document"
        value={formData.document_id || ''}
        onChange={(e) => setFormData({ ...formData, document_id: e || null })}
        options={documentOptions}
        disabled={isReadOnly}
      />

      {/* Project relations */}
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

        {!isReadOnly && (
          <div
            style={{
              display: 'flex',
              gap: '8px',
              alignItems: 'flex-end',
              marginBottom: '6px',
            }}
          >
            <div style={{ flex: 1 }}>
              <ThemedInput
                label=""
                value={projectFilter}
                onChange={(e) => setProjectFilter(e.target.value)}
                placeholder="Filter projects..."
                variant="primary"
              />
            </div>
            <button
              type="button"
              onClick={() => setShowOnlySelected((prev) => !prev)}
              style={{
                padding: '6px 12px',
                borderRadius: '6px',
                border: `2px solid ${showOnlySelected ? theme.colors.accent : theme.colors.primary + '40'}`,
                background: showOnlySelected
                  ? `${theme.colors.accent}18`
                  : 'transparent',
                color: showOnlySelected
                  ? theme.colors.accent
                  : theme.colors.text,
                fontSize: '12px',
                fontWeight: 500,
                cursor: 'pointer',
                whiteSpace: 'nowrap',
                transition: 'all 0.15s',
                marginBottom: '2px',
              }}
            >
              {showOnlySelected
                ? `Selected (${projectRows.length})`
                : 'All projects'}
            </button>
          </div>
        )}

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
          {filteredProjects.length === 0 && (
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
          {filteredProjects.map((project) => {
            const row = projectRows.find((r) => r.project_id === project.id);
            const isSelected = !!row;
            const relationColor = row
              ? RELATION_COLORS[row.relation]
              : theme.colors.primary;

            return (
              <div
                key={project.id}
                onClick={() => !isReadOnly && toggleProject(project.id)}
                style={{
                  display: 'flex',
                  alignItems: 'center',
                  gap: '10px',
                  padding: '8px 12px',
                  borderRadius: '8px',
                  border: `2px solid ${isSelected ? relationColor : theme.colors.primary + '25'}`,
                  background: isSelected
                    ? `${relationColor}12`
                    : `${theme.colors.primary}05`,
                  cursor: isReadOnly ? 'default' : 'pointer',
                  transition: 'all 0.15s',
                }}
              >
                {!isReadOnly && (
                  <input
                    type="checkbox"
                    checked={isSelected}
                    readOnly
                    style={{
                      width: '15px',
                      height: '15px',
                      cursor: 'pointer',
                      accentColor: relationColor,
                      flexShrink: 0,
                    }}
                  />
                )}
                <span
                  style={{
                    fontSize: '13px',
                    color: theme.colors.text,
                    flex: 1,
                  }}
                >
                  {project.name}
                </span>
                {isSelected && (
                  <div onClick={(e) => e.stopPropagation()}>
                    <select
                      value={row!.relation}
                      onChange={(e) =>
                        updateRelation(project.id, e.target.value)
                      }
                      disabled={isReadOnly}
                      style={{
                        padding: '2px 8px',
                        borderRadius: '6px',
                        border: `1.5px solid ${relationColor}`,
                        background: `${relationColor}15`,
                        color: relationColor,
                        fontSize: '12px',
                        fontWeight: 600,
                        cursor: isReadOnly ? 'default' : 'pointer',
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
                {!isSelected && isReadOnly && (
                  <span
                    style={{ fontSize: '11px', color: theme.colors.secondary }}
                  >
                    —
                  </span>
                )}
              </div>
            );
          })}
        </div>
      </div>

      {mode !== 'create' && (
        <ThemedSelect
          label="Status"
          value={status}
          onChange={setStatus}
          options={statusOptions}
          disabled={isReadOnly}
          allowEmpty={false}
        />
      )}

      {!isReadOnly && (
        <div className="flex justify-end gap-3 pt-4">
          <ThemedButton type="button" variant="secondary" onClick={onCancel}>
            Cancel
          </ThemedButton>
          <ThemedButton type="submit" variant="primary" isLoading={loading}>
            {mode === 'create' ? 'Create Tribe' : 'Update Tribe'}
          </ThemedButton>
        </div>
      )}
    </form>
  );
};
