import { useEffect, useCallback } from 'react';
import { useApi } from '@/hooks/useApi.ts';
import { kanbanService } from '@/features/kanban/service.ts';
import { todoListService } from '@/features/todo_list/service.ts';
import type { MyTasksResponse, MyTasksFilters, DashboardTask } from './types.ts';
import type { CardUpdate } from '@/features/kanban/types.ts';
import type { TodoItemUpdate } from '@/features/todo_list/types.ts';
import type { TaskPatch } from '@/components/tasks/types.ts';
import { getMyTasks } from './service.ts';

export function useMyTasks(filters: MyTasksFilters) {
    const { data, loading, error, execute } = useApi<MyTasksResponse>();

    const fetch = useCallback(async () => {
        await execute(() => getMyTasks(filters));
    }, [JSON.stringify(filters), execute]);

    useEffect(() => { fetch(); }, [fetch]);

    return { data, loading, error, refetch: fetch };
}

export function useMyTaskMutations() {
    const updateTask = useCallback(async (task: DashboardTask, patch: TaskPatch): Promise<void> => {
        if (task.source === 'kanban') {
            await kanbanService.updateCard(task.id, patch as CardUpdate);
        } else {
            await todoListService.update(task.id, patch as TodoItemUpdate);
        }
    }, []);

    const toggleLabel = useCallback(async (task: DashboardTask, labelId: string): Promise<void> => {
        const ids = task.label_ids;
        if (task.source === 'kanban') {
            if (ids.includes(labelId)) await kanbanService.removeCardLabel(task.id, labelId);
            else await kanbanService.addCardLabel(task.id, labelId);
        } else {
            await todoListService.toggleLabel(task.id, labelId);
        }
    }, []);

    const createLabel = useCallback(async (
        task: DashboardTask,
        data: { feature_instance_id: string; name: string; color: string },
    ) => {
        if (task.source === 'kanban') return kanbanService.createLabel(data);
        return todoListService.createLabel(data);
    }, []);

    return { updateTask, toggleLabel, createLabel };
}
