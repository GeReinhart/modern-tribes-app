import EditorJoditComponent from '@/app/platform/functions/documents/editor/EditorJoditComponent.tsx';
import { ThemedButton } from '@/app/platform/core/layout/themes/components/ThemedButton.tsx';
import { useTheme } from '@/app/platform/core/layout/themes/ThemeContext.tsx';
import TaskItemModalMeta from './TaskItemModalMeta.tsx';
import type { PersonOption, TaskLabelInfo } from './types.ts';

import React, { useState } from 'react';
import { useTranslation } from 'react-i18next';

export interface TaskCreateData {
  title: string;
  assigned_person_id: string | null;
  size: number | null;
  due_date: string | null;
  document_content_html: string | null;
  label_ids: string[];
  force_on_dashboard: boolean;
}

interface Props {
  featureInstanceId: string;
  labels: TaskLabelInfo[];
  persons: PersonOption[];
  canCreateLabel: boolean;
  onSubmit: (data: TaskCreateData) => Promise<void>;
  onCreateLabel: (data: { feature_instance_id: string; name: string; color: string }) => Promise<TaskLabelInfo | null>;
  onCancel: () => void;
}

const TaskCreateForm: React.FC<Props> = ({
  featureInstanceId, labels, persons, canCreateLabel,
  onSubmit, onCreateLabel, onCancel,
}) => {
  const { t } = useTranslation();
  const { theme } = useTheme();
  const [title, setTitle] = useState('');
  const [assigneeId, setAssigneeId] = useState('');
  const [size, setSize] = useState<number | null>(null);
  const [dueDate, setDueDate] = useState('');
  const [notes, setNotes] = useState('');
  const [forceOnDashboard, setForceOnDashboard] = useState(false);
  const [saving, setSaving] = useState(false);
  const [localLabelIds, setLocalLabelIds] = useState<string[]>([]);
  const [allLabels, setAllLabels] = useState<TaskLabelInfo[]>(labels);

  const inputStyle: React.CSSProperties = {
    width: '100%', padding: '8px 12px',
    border: `1px solid ${theme.colors.border}`,
    borderRadius: '8px', backgroundColor: theme.colors.surface,
    color: theme.colors.text, fontSize: 'var(--font-sm)', boxSizing: 'border-box',
  };

  const handleToggle = (labelId: string) => {
    setLocalLabelIds((prev) =>
      prev.includes(labelId) ? prev.filter((id) => id !== labelId) : [...prev, labelId],
    );
  };

  const handleLabelCreated = (label: TaskLabelInfo) => {
    setAllLabels((prev) => [...prev, label]);
    setLocalLabelIds((prev) => [...prev, label.id]);
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!title.trim()) return;
    setSaving(true);
    try {
      await onSubmit({
        title: title.trim(),
        assigned_person_id: assigneeId || null,
        size,
        due_date: dueDate || null,
        document_content_html: notes || null,
        label_ids: localLabelIds,
        force_on_dashboard: forceOnDashboard,
      });
    } finally {
      setSaving(false);
    }
  };

  return (
    <form onSubmit={handleSubmit} style={{ display: 'flex', flexDirection: 'column', gap: '18px' }}>
      <input
        placeholder={t('features.kanban.addCardPlaceholder')}
        value={title}
        onChange={(e) => setTitle(e.target.value)}
        style={{ ...inputStyle, fontSize: 'var(--font-md)', fontWeight: 600 }}
        autoFocus
      />

      <TaskItemModalMeta
        allLabels={allLabels}
        localLabelIds={localLabelIds}
        canEdit={true}
        canCreateLabel={canCreateLabel}
        featureInstanceId={featureInstanceId}
        persons={persons}
        assigneeId={assigneeId}
        onAssigneeChange={setAssigneeId}
        size={size}
        onSizeChange={setSize}
        dueDate={dueDate}
        onDueDateChange={setDueDate}
        onToggle={handleToggle}
        onCreateLabel={onCreateLabel}
        onLabelCreated={handleLabelCreated}
      />

      <div>
        <div style={{ fontSize: '11px', fontWeight: 700, textTransform: 'uppercase', letterSpacing: '0.06em', marginBottom: '8px', color: theme.colors.secondary }}>
          {t('features.kanban.notes')}
        </div>
        <EditorJoditComponent content={notes} onChange={setNotes} compact minHeight={200} />
      </div>

      <label style={{ display: 'flex', alignItems: 'center', gap: '10px', cursor: 'pointer', userSelect: 'none' }}>
        <input
          type="checkbox"
          checked={forceOnDashboard}
          onChange={(e) => setForceOnDashboard(e.target.checked)}
          style={{ width: '16px', height: '16px', accentColor: theme.colors.primary, cursor: 'pointer' }}
        />
        <span style={{ fontSize: 'var(--font-sm)', color: theme.colors.text, fontWeight: 600 }}>
          {t('common.forceOnDashboard')}
        </span>
      </label>

      <div style={{ display: 'flex', gap: '8px' }}>
        <ThemedButton variant="primary" type="submit" disabled={!title.trim() || saving}>
          {t('dashboard.quickAdd.create')}
        </ThemedButton>
        <ThemedButton variant="secondary" type="button" onClick={onCancel}>
          {t('common.cancel')}
        </ThemedButton>
      </div>
    </form>
  );
};

export default TaskCreateForm;
