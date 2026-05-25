import { ThemedLoadingSpinner } from '@/components/common/layout/ThemedLoadingSpinner.tsx';
import type { TaskLabelInfo, TaskPatch } from '@/components/tasks/types.ts';
import { useTheme } from '@/contexts/ThemeContext.tsx';
import type { PersonOption } from '@/types/features.ts';

import React, { useCallback, useMemo, useState } from 'react';

import { useMyTaskMutations, useMyTasks } from '../hooks.ts';
import type {
  DashboardTask,
  MyTasksFilters,
  MyTasksResponse,
} from '../types.ts';
import DashboardTasksFilters from './DashboardTasksFilters.tsx';
import DashboardTasksList from './DashboardTasksList.tsx';

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

const DashboardTasksTab: React.FC = () => {
  const { theme } = useTheme();
  const [filters, setFilters] = useState<MyTasksFilters>({});

  const { data, loading, error, refetch } = useMyTasks(filters);
  const { updateTask, toggleLabel, createLabel } = useMyTaskMutations();

  const tasks: MyTasksResponse = data ?? empty;
  const allDashTasks: DashboardTask[] = useMemo(
    () => [...tasks.kanban, ...tasks.todo],
    [tasks],
  );
  const effectivePersons = useMemo(() => uniquePersons(tasks), [tasks]);

  const handleUpdate = useCallback(
    async (task: DashboardTask, patch: TaskPatch) => {
      await updateTask(task, patch);
      await refetch();
    },
    [updateTask, refetch],
  );

  const handleToggleLabel = useCallback(
    async (task: DashboardTask, labelId: string) => {
      await toggleLabel(task, labelId);
      await refetch();
    },
    [toggleLabel, refetch],
  );

  const handleCreateLabel = useCallback(
    async (
      task: DashboardTask,
      data: { feature_instance_id: string; name: string; color: string },
    ): Promise<TaskLabelInfo | null> => {
      const created = await createLabel(task, data);
      await refetch();
      if (!created) return null;
      return { ...created, feature_instance_id: task.feature_instance_id };
    },
    [createLabel, refetch],
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
      <DashboardTasksFilters
        tasks={allDashTasks}
        filters={filters}
        effectivePersons={effectivePersons}
        onChange={setFilters}
      />
      <DashboardTasksList
        data={tasks}
        persons={effectivePersons}
        canEdit={true}
        onUpdate={handleUpdate}
        onToggleLabel={handleToggleLabel}
        onCreateLabel={handleCreateLabel}
      />
    </div>
  );
};

export default DashboardTasksTab;
