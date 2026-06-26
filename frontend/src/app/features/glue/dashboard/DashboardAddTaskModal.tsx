import { ThemedSvgIcon } from '@/app/platform/core/layout/themes/icons/ThemedSvgIcon.tsx';
import { useTheme } from '@/app/platform/core/layout/themes/ThemeContext.tsx';
import { kanbanService } from '@/app/features/tasks/kanban/service.ts';
import { todoListService } from '@/app/features/tasks/todo_list/service.ts';
import type { KanbanLabel } from '@/app/features/tasks/kanban/types.ts';
import type { PersonOption, TaskLabelInfo } from '@/app/features/tasks/types.ts';
import type { ProjectFeatureInstance } from '@/app/features/tribes-projects/projects/project-features.types.ts';
import TaskCreateForm, { type TaskCreateData } from '@/app/features/tasks/TaskCreateForm.tsx';
import FeatureInstanceBadgePicker from './FeatureInstanceBadgePicker.tsx';

import React, { useEffect, useState } from 'react';
import { useTranslation } from 'react-i18next';

interface Props {
  onClose: () => void;
  onCreated: () => void;
}

const TASK_FEATURE_TYPES = ['kanban', 'todo_list'];

function toTaskLabels(labels: KanbanLabel[], instanceId: string): TaskLabelInfo[] {
  return labels.map((l) => ({ ...l, feature_instance_id: instanceId }));
}

const DashboardAddTaskModal: React.FC<Props> = ({ onClose, onCreated }) => {
  const { t } = useTranslation();
  const { theme } = useTheme();
  const [selectedInstance, setSelectedInstance] = useState<ProjectFeatureInstance | null>(null);
  const [persons, setPersons] = useState<PersonOption[]>([]);
  const [labels, setLabels] = useState<TaskLabelInfo[]>([]);

  useEffect(() => {
    if (!selectedInstance) { setPersons([]); setLabels([]); return; }
    if (selectedInstance.feature_type === 'kanban') {
      Promise.all([kanbanService.getBoard(selectedInstance.id), kanbanService.getPersons(selectedInstance.id)]).then(
        ([board, ps]) => { setLabels(toTaskLabels(board.labels, selectedInstance.id)); setPersons(ps); },
      );
    } else {
      Promise.all([todoListService.listLabels(selectedInstance.id), todoListService.listPersons(selectedInstance.id)]).then(
        ([ls, ps]) => { setLabels(ls.map((l) => ({ ...l, feature_instance_id: selectedInstance.id }))); setPersons(ps); },
      );
    }
  }, [selectedInstance]);

  const handleCreateLabel = async (data: { feature_instance_id: string; name: string; color: string }): Promise<TaskLabelInfo | null> => {
    if (!selectedInstance) return null;
    try {
      const created = selectedInstance.feature_type === 'kanban'
        ? await kanbanService.createLabel(data)
        : await todoListService.createLabel(data);
      return { ...created, feature_instance_id: selectedInstance.id };
    } catch { return null; }
  };

  const handleSubmit = async (data: TaskCreateData) => {
    if (!selectedInstance) return;
    if (selectedInstance.feature_type === 'kanban') {
      const board = await kanbanService.getBoard(selectedInstance.id);
      const firstColumn = [...board.columns].sort((a, b) => a.position - b.position)[0];
      if (!firstColumn) return;
      const card = await kanbanService.createCard({
        feature_instance_id: selectedInstance.id,
        column_id: firstColumn.id,
        title: data.title,
        assigned_person_id: data.assigned_person_id,
        force_on_dashboard: data.force_on_dashboard,
      });
      const patch: Parameters<typeof kanbanService.updateCard>[1] = {};
      if (data.size !== null) patch.size = data.size;
      if (data.due_date) patch.due_date = data.due_date;
      if (data.document_content_html) patch.document_content_html = data.document_content_html;
      if (Object.keys(patch).length > 0) await kanbanService.updateCard(card.id, patch);
      for (const labelId of data.label_ids) await kanbanService.addCardLabel(card.id, labelId);
    } else {
      const item = await todoListService.create({ feature_instance_id: selectedInstance.id, title: data.title, force_on_dashboard: data.force_on_dashboard });
      const patch: Parameters<typeof todoListService.update>[1] = {};
      if (data.assigned_person_id) patch.assigned_person_id = data.assigned_person_id;
      if (data.size !== null) patch.size = data.size;
      if (data.due_date) patch.due_date = data.due_date;
      if (data.document_content_html) patch.document_content_html = data.document_content_html;
      if (Object.keys(patch).length > 0) await todoListService.update(item.id, patch);
      for (const labelId of data.label_ids) await todoListService.toggleLabel(item.id, labelId);
    }
    onCreated();
    onClose();
  };

  return (
    <div
      style={{ position: 'fixed', inset: 0, backgroundColor: 'rgba(0,0,0,0.55)', display: 'flex', alignItems: 'center', justifyContent: 'center', zIndex: 300, padding: '8px' }}
      onClick={(e) => { if (e.target === e.currentTarget) onClose(); }}
    >
      <div
        style={{ backgroundColor: theme.colors.surface, borderRadius: '12px', padding: '24px', width: '100%', maxWidth: '640px', maxHeight: '90vh', overflowY: 'auto', boxShadow: '0 8px 32px rgba(0,0,0,0.24)' }}
        onClick={(e) => e.stopPropagation()}
      >
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '20px' }}>
          <span style={{ display: 'flex', alignItems: 'center', gap: '8px', fontWeight: 700, fontSize: 'var(--font-lg)', color: theme.colors.text }}>
            <ThemedSvgIcon name="check" color={theme.colors.primary} size={20} />
            {t('dashboard.quickAdd.addTask')}
          </span>
          <button type="button" onClick={onClose} style={{ background: 'none', border: 'none', cursor: 'pointer' }}>
            <ThemedSvgIcon name="x" color={theme.colors.secondary} size={20} />
          </button>
        </div>

        <div style={{ display: 'flex', flexDirection: 'column', gap: '20px' }}>
          <FeatureInstanceBadgePicker
            featureTypes={TASK_FEATURE_TYPES}
            selectedInstanceId={selectedInstance?.id ?? null}
            onSelect={setSelectedInstance}
          />

          {selectedInstance && (
            <TaskCreateForm
              featureInstanceId={selectedInstance.id}
              labels={labels}
              persons={persons}
              canCreateLabel={true}
              onSubmit={handleSubmit}
              onCreateLabel={handleCreateLabel}
              onCancel={onClose}
            />
          )}
        </div>
      </div>
    </div>
  );
};

export default DashboardAddTaskModal;
