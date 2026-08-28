import { ManageLabelsModal } from '@/app/platform/core/layout/themes/components/ManageLabelsModal.tsx';
import { ThemedSvgIcon } from '@/app/platform/core/layout/themes/icons/ThemedSvgIcon.tsx';
import { useTheme } from '@/app/platform/core/layout/themes/ThemeContext.tsx';

import React, { useState } from 'react';
import { useTranslation } from 'react-i18next';

import type { TaskLabelInfo } from './types.ts';

interface Props {
  labels: TaskLabelInfo[];
  activeIds: string[];
  canEdit: boolean;
  canCreateLabel: boolean;
  featureInstanceId: string;
  onToggle: (labelId: string) => void;
  onCreateLabel: (data: {
    feature_instance_id: string;
    name: string;
    color: string;
  }) => Promise<TaskLabelInfo | null>;
  onLabelCreated: (label: TaskLabelInfo) => void;
  onUpdateLabel: (labelId: string, updates: { name?: string; color?: string }) => Promise<void>;
  onLabelUpdated: (label: TaskLabelInfo) => void;
  onDeleteLabel: (labelId: string) => Promise<void>;
  onLabelDeleted: (labelId: string) => void;
  onReorderLabel: (orderedIds: string[]) => Promise<void>;
}

const TaskItemModalLabels: React.FC<Props> = ({
  labels,
  activeIds,
  canEdit,
  canCreateLabel,
  featureInstanceId,
  onToggle,
  onCreateLabel,
  onLabelCreated,
  onUpdateLabel,
  onLabelUpdated,
  onDeleteLabel,
  onLabelDeleted,
  onReorderLabel,
}) => {
  const { t } = useTranslation();
  const { theme } = useTheme();
  const [managing, setManaging] = useState(false);

  return (
    <div>
      <div style={{ display: 'flex', flexWrap: 'wrap', gap: '6px', alignItems: 'center' }}>
        {labels.map((label) => {
          const active = activeIds.includes(label.id);
          return (
            <button
              key={label.id}
              type="button"
              onClick={() => (canEdit ? onToggle(label.id) : undefined)}
              disabled={!canEdit}
              style={{
                padding: '4px 12px',
                borderRadius: '12px',
                border: `1.5px solid ${label.color}`,
                background: active ? label.color : 'transparent',
                color: active ? theme.colors.surface : label.color,
                fontSize: '12px',
                fontWeight: 600,
                cursor: canEdit ? 'pointer' : 'default',
                transition: 'all 0.15s',
              }}
            >
              {label.name}
            </button>
          );
        })}
        {canCreateLabel && (
          <button
            type="button"
            onClick={() => setManaging(true)}
            title={t('labels.manage')}
            style={{
              display: 'flex',
              alignItems: 'center',
              gap: '4px',
              padding: '3px 10px',
              borderRadius: '12px',
              border: `1.5px dashed ${theme.colors.border}`,
              background: 'none',
              color: theme.colors.secondary,
              fontSize: '12px',
              fontWeight: 600,
              cursor: 'pointer',
            }}
          >
            <ThemedSvgIcon name="plus" color={theme.colors.secondary} size={12} />
            {t('features.kanban.addLabel')}
          </button>
        )}
      </div>
      {canCreateLabel && (
        <ManageLabelsModal
          isOpen={managing}
          onClose={() => setManaging(false)}
          labels={labels}
          onCreate={async (name, color) => {
            const created = await onCreateLabel({ feature_instance_id: featureInstanceId, name, color });
            if (created) onLabelCreated(created);
          }}
          onUpdate={async (id, updates) => {
            await onUpdateLabel(id, updates);
            onLabelUpdated({ id, feature_instance_id: featureInstanceId, name: updates.name ?? labels.find((l) => l.id === id)?.name ?? '', color: updates.color ?? labels.find((l) => l.id === id)?.color ?? '' });
          }}
          onDelete={async (id) => {
            await onDeleteLabel(id);
            onLabelDeleted(id);
          }}
          onReorder={onReorderLabel}
        />
      )}
    </div>
  );
};

export default TaskItemModalLabels;
