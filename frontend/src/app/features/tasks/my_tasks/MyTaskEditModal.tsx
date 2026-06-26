import KanbanCardModal from '@/app/features/tasks/kanban/KanbanCardModal.tsx';
import TodoItemModal from '@/app/features/tasks/todo_list/TodoItemModal.tsx';
import { kanbanService } from '@/app/features/tasks/kanban/service.ts';
import { todoListService } from '@/app/features/tasks/todo_list/service.ts';
import type { KanbanCard, CardUpdate, LabelCreate } from '@/app/features/tasks/kanban/types.ts';
import type { TodoItem, TodoItemUpdate, TodoLabelCreate } from '@/app/features/tasks/todo_list/types.ts';
import type { FeatureLabel, PersonOption } from '@/app/features/tasks/types.ts';

import React, { useEffect, useState } from 'react';

import type { MyKanbanTask, MyTask, MyTodoTask } from './types.ts';

interface Props {
  task: MyTask;
  onClose: () => void;
  onSaved: () => void;
}

function toKanbanCard(task: MyKanbanTask): KanbanCard {
  return {
    id: task.id,
    feature_instance_id: task.feature_instance_id,
    column_id: task.column_id,
    title: task.title,
    assigned_person_id: task.assigned_person_id,
    assigned_person_name: task.assigned_person_name,
    document_id: null,
    document_content_html: task.document_content_html,
    position: 0,
    status: 'active',
    size: task.size,
    due_date: task.due_date || null,
    force_on_dashboard: task.force_on_dashboard,
    label_ids: task.label_ids,
    created_at: null,
    updated_at: null,
    created_by: null,
    updated_by: null,
  };
}

function toTodoItem(task: MyTodoTask): TodoItem {
  return {
    id: task.id,
    feature_instance_id: task.feature_instance_id,
    title: task.title,
    status: 'active',
    todo_status: task.todo_status as 'todo' | 'done',
    document_id: null,
    document_content_html: task.document_content_html,
    position: 0,
    size: task.size,
    due_date: task.due_date || null,
    force_on_dashboard: task.force_on_dashboard,
    assigned_person_id: task.assigned_person_id,
    assigned_person_name: task.assigned_person_name,
    label_ids: task.label_ids,
    created_at: '',
    updated_at: '',
    created_by: null,
    updated_by: null,
  };
}

const MyTaskEditModal: React.FC<Props> = ({ task, onClose, onSaved }) => {
  const [labels, setLabels] = useState<FeatureLabel[]>([]);
  const [persons, setPersons] = useState<PersonOption[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    if (task.source === 'kanban') {
      Promise.all([
        kanbanService.getBoard(task.feature_instance_id),
        kanbanService.getPersons(task.feature_instance_id),
      ]).then(([board, ps]) => { setLabels(board.labels); setPersons(ps); setLoading(false); });
    } else {
      Promise.all([
        todoListService.listLabels(task.feature_instance_id),
        todoListService.listPersons(task.feature_instance_id),
      ]).then(([ls, ps]) => { setLabels(ls); setPersons(ps); setLoading(false); });
    }
  }, [task.id, task.feature_instance_id, task.source]);

  if (loading) return null;

  if (task.source === 'kanban') {
    return (
      <KanbanCardModal
        card={toKanbanCard(task as MyKanbanTask)}
        boardLabels={labels}
        persons={persons}
        canEdit={true}
        onClose={onClose}
        onUpdate={async (cardId: string, data: CardUpdate) => { await kanbanService.updateCard(cardId, data); onSaved(); }}
        onToggleLabel={async (cardId: string, labelId: string, currentLabelIds: string[]) => {
          if (currentLabelIds.includes(labelId)) await kanbanService.removeCardLabel(cardId, labelId);
          else await kanbanService.addCardLabel(cardId, labelId);
        }}
        onCreateLabel={async (data: LabelCreate) => { try { return await kanbanService.createLabel(data); } catch { return null; } }}
      />
    );
  }

  return (
    <TodoItemModal
      item={toTodoItem(task as MyTodoTask)}
      labels={labels}
      persons={persons}
      canEdit={true}
      featureInstanceId={task.feature_instance_id}
      onClose={onClose}
      onUpdate={async (itemId: string, data: TodoItemUpdate) => { await todoListService.update(itemId, data); onSaved(); }}
      onToggleLabel={async (_itemId: string, labelId: string) => { await todoListService.toggleLabel(task.id, labelId); }}
      onCreateLabel={async (data: TodoLabelCreate) => { try { return await todoListService.createLabel(data); } catch { return null; } }}
    />
  );
};

export default MyTaskEditModal;
