import type { TaskPatch } from '@/app/features/tasks/types.ts';
import { kanbanService } from '@/app/features/tasks/kanban/service.ts';
import type { CardUpdate } from '@/app/features/tasks/kanban/types.ts';
import { todoListService } from '@/app/features/tasks/todo_list/service.ts';
import type { TodoItemUpdate } from '@/app/features/tasks/todo_list/types.ts';
import { apiHooks } from '@/app/platform/core/api/api-hooks.ts';

import { useCallback, useEffect } from 'react';

import { getMyTasks } from './dashboard-service.ts';
import type {
  DashboardTask,
  MyTasksFilters,
  MyTasksResponse,
} from './dashboard-types.ts';

export function useMyTasks(filters: MyTasksFilters) {
  const { data, loading, error, execute } = apiHooks<MyTasksResponse>();

  const filtersKey = JSON.stringify(filters);
  const fetch = useCallback(async () => {
    await execute(() => getMyTasks(filters));
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [filtersKey, execute]);

  useEffect(() => {
    fetch();
  }, [fetch]);

  return { data, loading, error, refetch: fetch };
}

export function useMyTaskMutations() {
  const updateTask = useCallback(
    async (task: DashboardTask, patch: TaskPatch): Promise<void> => {
      if (task.source === 'kanban') {
        await kanbanService.updateCard(task.id, patch as CardUpdate);
      } else {
        await todoListService.update(task.id, patch as TodoItemUpdate);
      }
    },
    [],
  );

  const toggleLabel = useCallback(
    async (task: DashboardTask, labelId: string): Promise<void> => {
      const ids = task.label_ids;
      if (task.source === 'kanban') {
        if (ids.includes(labelId))
          await kanbanService.removeCardLabel(task.id, labelId);
        else await kanbanService.addCardLabel(task.id, labelId);
      } else {
        await todoListService.toggleLabel(task.id, labelId);
      }
    },
    [],
  );

  const createLabel = useCallback(
    async (
      task: DashboardTask,
      data: { feature_instance_id: string; name: string; color: string },
    ) => {
      if (task.source === 'kanban') return kanbanService.createLabel(data);
      return todoListService.createLabel(data);
    },
    [],
  );

  return { updateTask, toggleLabel, createLabel };
}
