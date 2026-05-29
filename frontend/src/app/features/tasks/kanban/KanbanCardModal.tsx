import TaskItemModal from '@/app/features/tasks/TaskItemModal.tsx';
import type { TaskLabelInfo, TaskPatch } from '@/app/features/tasks/types.ts';

import React from 'react';

import type {
  CardUpdate,
  KanbanCard,
  KanbanLabel,
  LabelCreate,
  PersonOption,
} from './types.ts';

interface Props {
  card: KanbanCard;
  boardLabels: KanbanLabel[];
  persons: PersonOption[];
  canEdit: boolean;
  onClose: () => void;
  onUpdate: (cardId: string, data: CardUpdate) => Promise<void>;
  onToggleLabel: (
    cardId: string,
    labelId: string,
    currentLabelIds: string[],
  ) => Promise<void>;
  onCreateLabel: (data: LabelCreate) => Promise<KanbanLabel | null>;
}

const KanbanCardModal: React.FC<Props> = ({
  card,
  boardLabels,
  persons,
  canEdit,
  onClose,
  onUpdate,
  onToggleLabel,
  onCreateLabel,
}) => {
  const labels: TaskLabelInfo[] = boardLabels.map((l) => ({
    ...l,
    feature_instance_id: card.feature_instance_id,
  }));

  const handleUpdate = (id: string, patch: TaskPatch) =>
    onUpdate(id, patch as CardUpdate);

  const handleCreateLabel = async (data: {
    feature_instance_id: string;
    name: string;
    color: string;
  }): Promise<TaskLabelInfo | null> => {
    const created = await onCreateLabel(data as LabelCreate);
    if (!created) return null;
    return { ...created, feature_instance_id: card.feature_instance_id };
  };

  return (
    <TaskItemModal
      value={{
        id: card.id,
        feature_instance_id: card.feature_instance_id,
        title: card.title,
        size: card.size,
        due_date: card.due_date,
        assigned_person_id: card.assigned_person_id,
        document_content_html: card.document_content_html,
        label_ids: card.label_ids,
        created_by: card.created_by,
        updated_by: card.updated_by,
        created_at: card.created_at,
        updated_at: card.updated_at,
      }}
      labels={labels}
      persons={persons}
      canEdit={canEdit}
      canCreateLabel={canEdit}
      onClose={onClose}
      onUpdate={handleUpdate}
      onToggleLabel={onToggleLabel}
      onCreateLabel={handleCreateLabel}
    />
  );
};

export default KanbanCardModal;
