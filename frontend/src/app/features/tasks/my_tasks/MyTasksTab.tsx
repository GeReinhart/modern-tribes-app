import { ThemedLoadingSpinner } from '@/app/platform/core/layout/themes/components/ThemedLoadingSpinner.tsx';
import { useTheme } from '@/app/platform/core/layout/themes/ThemeContext.tsx';
import type { PersonOption } from '@/app/features/tasks/types.ts';

import React, { useCallback, useMemo, useState } from 'react';

import { useMyTaskMutations, useMyTasks } from './hooks.ts';
import type { MyTask, MyTasksFilters, MyTasksResponse } from './types.ts';
import MyTasksFiltersPanel from './MyTasksFilters.tsx';
import MyTasksList from './MyTasksList.tsx';

function uniquePersons(data: MyTasksResponse): PersonOption[] {
  const seen = new Set<string>();
  const persons: PersonOption[] = [];
  const tasks = [...data.kanban, ...data.todo];
  for (const t of tasks) {
    if (
      t.assigned_person_id &&
      t.assigned_person_name &&
      !seen.has(t.assigned_person_id)
    ) {
      seen.add(t.assigned_person_id);
      persons.push({ id: t.assigned_person_id, name: t.assigned_person_name });
    }
  }
  return persons;
}

const empty: MyTasksResponse = { kanban: [], todo: [] };

const MyTasksTab: React.FC = () => {
  const { theme } = useTheme();
  const [filters, setFilters] = useState<MyTasksFilters>({});

  const { data, loading, error, refetch } = useMyTasks(filters);
  const { markAsDone } = useMyTaskMutations();

  const tasks: MyTasksResponse = data ?? empty;
  const allTasks: MyTask[] = useMemo(
    () => [...tasks.kanban, ...tasks.todo],
    [tasks],
  );
  const effectivePersons = useMemo(() => uniquePersons(tasks), [tasks]);

  const handleMarkDone = useCallback(
    async (task: MyTask) => {
      await markAsDone(task);
      await refetch();
    },
    [markAsDone, refetch],
  );

  if (loading) {
    return (
      <div
        style={{ display: 'flex', justifyContent: 'center', padding: '40px 0' }}
      >
        <ThemedLoadingSpinner size="sm" />
      </div>
    );
  }

  if (error) {
    return (
      <div
        style={{
          color: theme.colors.danger,
          fontSize: 'var(--font-sm)',
          padding: '12px 0',
        }}
      >
        {error}
      </div>
    );
  }

  return (
    <div>
      <MyTasksFiltersPanel
        tasks={allTasks}
        filters={filters}
        effectivePersons={effectivePersons}
        onChange={setFilters}
      />
      <MyTasksList
        data={tasks}
        persons={effectivePersons}
        onMarkDone={handleMarkDone}
      />
    </div>
  );
};

export default MyTasksTab;
