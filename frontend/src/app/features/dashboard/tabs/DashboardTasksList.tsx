import type { TaskLabelInfo, TaskPatch } from '@/app/features/tasks/types.ts';
import { useTheme } from '@/app/platform/core/layout/themes/ThemeContext.tsx';
import type { PersonOption } from '@/app/features/tasks/types.ts';

import React from 'react';
import { useTranslation } from 'react-i18next';

import type { DashboardTask, MyTasksResponse } from '../dashboard-types.ts';
import DashboardTaskCard from './DashboardTaskCard.tsx';

interface Props {
  data: MyTasksResponse;
  persons: PersonOption[];
  canEdit: boolean;
  onUpdate: (task: DashboardTask, patch: TaskPatch) => Promise<void>;
  onToggleLabel: (task: DashboardTask, labelId: string) => Promise<void>;
  onCreateLabel: (
    task: DashboardTask,
    data: { feature_instance_id: string; name: string; color: string },
  ) => Promise<TaskLabelInfo | null>;
}

function sortTasks(tasks: DashboardTask[]): DashboardTask[] {
  return [...tasks].sort((a, b) => {
    if (a.due_date < b.due_date) return -1;
    if (a.due_date > b.due_date) return 1;
    return (b.size ?? 0) - (a.size ?? 0);
  });
}

const DashboardTasksList: React.FC<Props> = ({
  data,
  persons,
  canEdit,
  onUpdate,
  onToggleLabel,
  onCreateLabel,
}) => {
  const { t } = useTranslation();
  const { theme } = useTheme();

  const allTasks: DashboardTask[] = sortTasks([
    ...data.kanban.map((k) => ({ ...k, source: 'kanban' as const })),
    ...data.todo.map((td) => ({ ...td, source: 'todo' as const })),
  ]);

  if (allTasks.length === 0) {
    return (
      <div
        style={{
          padding: '32px 0',
          textAlign: 'center',
          color: theme.colors.secondary,
          fontSize: 'var(--font-sm)',
        }}
      >
        {t('dashboard.tasks.empty')}
      </div>
    );
  }

  return (
    <div style={{ maxWidth: '680px' }}>
      {allTasks.map((task) => (
        <DashboardTaskCard
          key={`${task.source}-${task.id}`}
          task={task}
          persons={persons}
          canEdit={canEdit}
          onUpdate={(patch) => onUpdate(task, patch)}
          onToggleLabel={(labelId) => onToggleLabel(task, labelId)}
          onCreateLabel={(d) => onCreateLabel(task, d)}
        />
      ))}
    </div>
  );
};

export default DashboardTasksList;
