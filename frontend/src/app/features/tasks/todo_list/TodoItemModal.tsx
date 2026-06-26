import TaskItemModal from '@/app/features/tasks/TaskItemModal.tsx';
import type { TaskLabelInfo, TaskPatch } from '@/app/features/tasks/types.ts';
import type { PersonOption } from './types.ts';

import React from 'react';

import type {
  TodoItem,
  TodoItemUpdate,
  TodoLabel,
  TodoLabelCreate,
} from './types.ts';

interface Props {
  item: TodoItem;
  labels: TodoLabel[];
  persons: PersonOption[];
  canEdit: boolean;
  featureInstanceId: string;
  highlightToken?: string;
  onClose: () => void;
  onUpdate: (itemId: string, data: TodoItemUpdate) => Promise<void>;
  onToggleLabel: (itemId: string, labelId: string) => Promise<void>;
  onCreateLabel: (data: TodoLabelCreate) => Promise<TodoLabel | null>;
}

const TodoItemModal: React.FC<Props> = ({
  item,
  labels,
  persons,
  canEdit,
  featureInstanceId,
  highlightToken,
  onClose,
  onUpdate,
  onToggleLabel,
  onCreateLabel,
}) => {
  const taskLabels: TaskLabelInfo[] = labels.map((l) => ({
    ...l,
    feature_instance_id: featureInstanceId,
  }));

  const handleUpdate = (id: string, patch: TaskPatch) =>
    onUpdate(id, patch as TodoItemUpdate);

  const handleToggleLabel = (
    _id: string,
    labelId: string,
    _currentLabelIds: string[],
  ) => onToggleLabel(item.id, labelId);

  const handleCreateLabel = async (data: {
    feature_instance_id: string;
    name: string;
    color: string;
  }): Promise<TaskLabelInfo | null> => {
    const created = await onCreateLabel(data as TodoLabelCreate);
    if (!created) return null;
    return { ...created, feature_instance_id: featureInstanceId };
  };

  return (
    <TaskItemModal
      highlightToken={highlightToken}
      value={{
        id: item.id,
        feature_instance_id: featureInstanceId,
        title: item.title,
        size: item.size,
        due_date: item.due_date,
        assigned_person_id: item.assigned_person_id,
        document_content_html: item.document_content_html,
        label_ids: item.label_ids,
        force_on_dashboard: item.force_on_dashboard,
        created_by: item.created_by,
        updated_by: item.updated_by,
        created_at: item.created_at,
        updated_at: item.updated_at,
      }}
      labels={taskLabels}
      persons={persons}
      canEdit={canEdit}
      canCreateLabel={canEdit}
      onClose={onClose}
      onUpdate={handleUpdate}
      onToggleLabel={handleToggleLabel}
      onCreateLabel={handleCreateLabel}
    />
  );
};

export default TodoItemModal;
