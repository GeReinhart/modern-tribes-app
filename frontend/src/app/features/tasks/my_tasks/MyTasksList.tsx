import { useTheme } from '@/app/platform/core/layout/themes/ThemeContext.tsx';
import type { PersonOption } from '@/app/features/tasks/types.ts';

import React from 'react';
import { useTranslation } from 'react-i18next';

import MyTasksCard from './MyTasksCard.tsx';
import type { MyTask, MyTasksResponse } from './types.ts';

interface Props {
  data: MyTasksResponse;
  persons: PersonOption[];
  onMarkDone: (task: MyTask) => Promise<void>;
  onRefresh?: () => void;
}

function sortTasks(tasks: MyTask[]): MyTask[] {
  return [...tasks].sort((a, b) => {
    if (a.due_date < b.due_date) return -1;
    if (a.due_date > b.due_date) return 1;
    return (b.size ?? 0) - (a.size ?? 0);
  });
}

const MyTasksList: React.FC<Props> = ({ data, persons, onMarkDone, onRefresh }) => {
  const { t } = useTranslation();
  const { theme } = useTheme();

  const allTasks: MyTask[] = sortTasks([
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
        <MyTasksCard
          key={`${task.source}-${task.id}`}
          task={task}
          persons={persons}
          onMarkDone={() => onMarkDone(task)}
          onRefresh={onRefresh}
        />
      ))}
    </div>
  );
};

export default MyTasksList;
