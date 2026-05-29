import { useTheme } from '@/app/platform/core/layout/themes/ThemeContext.tsx';
import type { PersonOption } from '@/app/features/tasks/types.ts';

import React from 'react';
import { useTranslation } from 'react-i18next';

import { FolderOpen, Layers, Tag, User } from 'lucide-react';

import type { DashboardTask, MyTasksFilters } from '../dashboard-types.ts';

interface Props {
  tasks: DashboardTask[];
  filters: MyTasksFilters;
  effectivePersons: PersonOption[];
  onChange: (f: MyTasksFilters) => void;
}

function uniqueBy<T>(items: T[], key: (i: T) => string): T[] {
  const seen = new Set<string>();
  return items.filter((i) => {
    const k = key(i);
    if (seen.has(k)) return false;
    seen.add(k);
    return true;
  });
}

function pillStyle(active: boolean, color: string): React.CSSProperties {
  return {
    padding: '4px 12px',
    borderRadius: '16px',
    fontSize: 'var(--font-sm)',
    fontWeight: active ? 700 : 500,
    cursor: 'pointer',
    border: `1px solid ${color}`,
    backgroundColor: active ? `${color}20` : 'transparent',
    color,
    transition: 'all 0.15s',
    whiteSpace: 'nowrap',
  };
}

const DashboardTasksFilters: React.FC<Props> = ({
  tasks,
  filters,
  effectivePersons,
  onChange,
}) => {
  const { t } = useTranslation();
  const { theme } = useTheme();

  const tribes = uniqueBy(
    tasks
      .filter((tk) => tk.tribe_id)
      .map((tk) => ({ id: tk.tribe_id!, name: tk.tribe_name! })),
    (t) => t.id,
  );

  const projects = uniqueBy(
    tasks
      .filter((tk) => !filters.tribe_id || tk.tribe_id === filters.tribe_id)
      .map((tk) => ({ id: tk.project_id, name: tk.project_name })),
    (p) => p.id,
  );

  const labels = uniqueBy(
    tasks.flatMap((tk) => tk.labels),
    (l) => l.name.toLowerCase(),
  );

  const toggle = (key: keyof MyTasksFilters, value: string) =>
    onChange({
      ...filters,
      [key]: filters[key] === value ? undefined : value,
      ...(key === 'tribe_id' ? { project_id: undefined } : {}),
    });

  return (
    <div
      style={{
        display: 'flex',
        flexDirection: 'column',
        gap: '6px',
        marginBottom: '12px',
      }}
    >
      {tribes.length > 0 && (
        <div
          style={{
            display: 'flex',
            flexWrap: 'wrap',
            gap: '6px',
            alignItems: 'center',
          }}
        >
          <Layers size={14} color={theme.colors.secondary} />
          {tribes.map((tr) => (
            <button
              key={tr.id}
              type="button"
              onClick={() => toggle('tribe_id', tr.id)}
              style={pillStyle(filters.tribe_id === tr.id, theme.colors.accent)}
            >
              {tr.name}
            </button>
          ))}
        </div>
      )}
      {projects.length > 0 && (
        <div
          style={{
            display: 'flex',
            flexWrap: 'wrap',
            gap: '6px',
            alignItems: 'center',
          }}
        >
          <FolderOpen size={14} color={theme.colors.secondary} />
          {projects.map((p) => (
            <button
              key={p.id}
              type="button"
              onClick={() => toggle('project_id', p.id)}
              style={pillStyle(
                filters.project_id === p.id,
                theme.colors.primary,
              )}
            >
              {p.name}
            </button>
          ))}
        </div>
      )}
      {effectivePersons.length > 1 && (
        <div
          style={{
            display: 'flex',
            flexWrap: 'wrap',
            gap: '6px',
            alignItems: 'center',
          }}
        >
          <User size={14} color={theme.colors.secondary} />
          {effectivePersons.map((p) => (
            <button
              key={p.id}
              type="button"
              onClick={() => toggle('person_id', p.id)}
              style={pillStyle(
                filters.person_id === p.id,
                theme.colors.secondary,
              )}
            >
              {p.name}
            </button>
          ))}
        </div>
      )}
      {labels.length > 0 && (
        <div
          style={{
            display: 'flex',
            flexWrap: 'wrap',
            gap: '6px',
            alignItems: 'center',
          }}
        >
          <Tag size={14} color={theme.colors.secondary} />
          {labels.map((l) => (
            <button
              key={l.id}
              type="button"
              onClick={() => toggle('label_id', l.id)}
              style={pillStyle(filters.label_id === l.id, l.color)}
            >
              {l.name}
            </button>
          ))}
        </div>
      )}
      {Object.values(filters).some(Boolean) && (
        <div>
          <button
            type="button"
            onClick={() => onChange({})}
            style={{
              fontSize: 'var(--font-xs)',
              color: theme.colors.secondary,
              background: 'none',
              border: 'none',
              cursor: 'pointer',
              padding: '2px 0',
              textDecoration: 'underline',
            }}
          >
            {t('tribes.clearFilters')}
          </button>
        </div>
      )}
    </div>
  );
};

export default DashboardTasksFilters;
