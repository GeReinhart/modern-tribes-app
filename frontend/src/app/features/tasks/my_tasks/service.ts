import { apiService } from '@/app/platform/core/api/api.service.ts';

import type { MyTasksFilters, MyTasksResponse } from './types.ts';

function buildQuery(filters: MyTasksFilters): string {
  const params = new URLSearchParams();
  if (filters.tribe_id) params.set('tribe_id', filters.tribe_id);
  if (filters.project_id) params.set('project_id', filters.project_id);
  if (filters.person_id) params.set('person_id', filters.person_id);
  if (filters.label_id) params.set('label_id', filters.label_id);
  const qs = params.toString();
  return qs ? `?${qs}` : '';
}

export async function getMyTasks(
  filters: MyTasksFilters = {},
): Promise<MyTasksResponse> {
  return apiService.get<MyTasksResponse>(
    `/features/my-tasks${buildQuery(filters)}`,
  );
}
