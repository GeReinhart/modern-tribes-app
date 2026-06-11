import ThemedDateSelection from '@/app/platform/core/layout/themes/components/ThemedDateSelection.tsx';
import { useTheme } from '@/app/platform/core/layout/themes/ThemeContext.tsx';

import React from 'react';
import { useTranslation } from 'react-i18next';

import TaskItemModalLabels from './TaskItemModalLabels.tsx';
import type { TaskLabelInfo } from './types.ts';
import { FIBONACCI, PersonOption, fibColor } from './types.ts';

interface Props {
  allLabels: TaskLabelInfo[];
  localLabelIds: string[];
  canEdit: boolean;
  canCreateLabel: boolean;
  featureInstanceId: string;
  persons: PersonOption[];
  assigneeId: string;
  onAssigneeChange: (id: string) => void;
  size: number | null;
  onSizeChange: (s: number | null) => void;
  dueDate: string;
  onDueDateChange: (d: string) => void;
  onToggle: (labelId: string) => void;
  onCreateLabel: (data: {
    feature_instance_id: string;
    name: string;
    color: string;
  }) => Promise<TaskLabelInfo | null>;
  onLabelCreated: (label: TaskLabelInfo) => void;
}

const sectionLabel: React.CSSProperties = {
  fontSize: '11px',
  fontWeight: 700,
  textTransform: 'uppercase',
  letterSpacing: '0.06em',
  marginBottom: '8px',
};

const TaskItemModalMeta: React.FC<Props> = ({
  allLabels, localLabelIds, canEdit, canCreateLabel, featureInstanceId,
  persons, assigneeId, onAssigneeChange,
  size, onSizeChange, dueDate, onDueDateChange,
  onToggle, onCreateLabel, onLabelCreated,
}) => {
  const { t } = useTranslation();
  const { theme } = useTheme();

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
    <>
      <div style={{ display: 'flex', gap: '16px', alignItems: 'flex-start' }}>
        <div style={{ flex: 1 }}>
          <div style={{ ...sectionLabel, color: theme.colors.secondary }}>
            {t('features.kanban.manageLabels')}
          </div>
          <TaskItemModalLabels
            labels={allLabels}
            activeIds={localLabelIds}
            canEdit={canEdit}
            canCreateLabel={canCreateLabel}
            featureInstanceId={featureInstanceId}
            onToggle={onToggle}
            onCreateLabel={onCreateLabel}
            onLabelCreated={onLabelCreated}
          />
        </div>
        {persons.length > 0 && (
          <div style={{ flexShrink: 0 }}>
            <div style={{ ...sectionLabel, color: theme.colors.secondary }}>
              {t('features.kanban.assignee')}
            </div>
            <select
              value={assigneeId}
              onChange={(e) => onAssigneeChange(e.target.value)}
              disabled={!canEdit}
              style={{ ...inputStyle, width: 'auto', minWidth: '160px' }}
            >
              <option value="">{t('features.kanban.noAssignee')}</option>
              {persons.map((p) => (
                <option key={p.id} value={p.id}>{p.name}</option>
              ))}
            </select>
          </div>
        )}
      </div>
      <div style={{ display: 'flex', gap: '24px', flexWrap: 'wrap' }}>
        <div style={{ flex: '1 1 200px' }}>
          <div style={{ ...sectionLabel, color: theme.colors.secondary }}>
            {t('features.kanban.size')}
          </div>
          <div style={{ display: 'flex', gap: '5px', flexWrap: 'wrap' }}>
            {FIBONACCI.map((n) => (
              <button
                key={n}
                onClick={() => canEdit ? onSizeChange(size === n ? null : n) : undefined}
                disabled={!canEdit}
                style={{
                  width: '36px', height: '32px',
                  border: size === n ? `2px solid ${fibColor(n)}` : `1px solid ${theme.colors.border}`,
                  borderRadius: '6px',
                  background: size === n ? fibColor(n) : 'transparent',
                  color: size === n ? theme.colors.surface : fibColor(n),
                  fontWeight: 700, fontSize: '13px',
                  cursor: canEdit ? 'pointer' : 'default',
                  transition: 'all 0.15s',
                }}
              >
                {n}
              </button>
            ))}
          </div>
        </div>
        <ThemedDateSelection
          label={t('features.kanban.dueDate')}
          value={dueDate}
          onChange={onDueDateChange}
          disabled={!canEdit}
        />
      </div>
    </>
  );
};

export default TaskItemModalMeta;
