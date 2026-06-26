import { kanbanService } from '@/app/features/tasks/kanban/service.ts';
import { todoListService } from '@/app/features/tasks/todo_list/service.ts';
import { apiHooks } from '@/app/platform/core/api/api-hooks.ts';

import { useCallback, useEffect } from 'react';

import { getMyTasks } from './service.ts';
import type { MyTask, MyTasksFilters, MyTasksResponse } from './types.ts';

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
  const markAsDone = useCallback(async (task: MyTask): Promise<void> => {
    if (task.source === 'kanban') {
      await kanbanService.moveCardToLastColumn(task.id);
    } else {
      await todoListService.update(task.id, { todo_status: 'done' });
    }
  }, []);

  return { markAsDone };
}
