import { ThemedLoadingSpinner } from '@/app/platform/core/layout/themes/components/ThemedLoadingSpinner.tsx';
import { useTheme } from '@/app/platform/core/layout/themes/ThemeContext.tsx';
import { useRegisterTabActions } from '@/app/platform/core/layout/useRegisterTabActions.ts';
import type { PersonOption } from '@/app/features/tasks/types.ts';
import DashboardAddTaskModal from '@/app/features/glue/dashboard/DashboardAddTaskModal.tsx';

import React, { useCallback, useMemo, useState } from 'react';
import { useTranslation } from 'react-i18next';

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
  const { t } = useTranslation();
  const { theme } = useTheme();
  const [filters, setFilters] = useState<MyTasksFilters>({});
  const [showAddTask, setShowAddTask] = useState(false);

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

  const tabActions = useMemo(
    () => [
      {
        icon: 'plus' as const,
        label: t('dashboard.quickAdd.addTask'),
        onClick: () => setShowAddTask(true),
      },
    ],
    [t],
  );
  useRegisterTabActions(tabActions);

  if (loading) {
    return (
      <div style={{ display: 'flex', justifyContent: 'center', padding: '40px 0' }}>
        <ThemedLoadingSpinner size="sm" />
      </div>
    );
  }

  if (error) {
    return (
      <div style={{ color: theme.colors.danger, fontSize: 'var(--font-sm)', padding: '12px 0' }}>
        {error}
      </div>
    );
  }

  return (
    <div>
      <div style={{ marginBottom: '12px' }}>
        <MyTasksFiltersPanel
          tasks={allTasks}
          filters={filters}
          effectivePersons={effectivePersons}
          onChange={setFilters}
        />
      </div>

      <MyTasksList
        data={tasks}
        persons={effectivePersons}
        onMarkDone={handleMarkDone}
        onRefresh={refetch}
      />

      {showAddTask && (
        <DashboardAddTaskModal
          onClose={() => setShowAddTask(false)}
          onCreated={refetch}
        />
      )}
    </div>
  );
};

export default MyTasksTab;
