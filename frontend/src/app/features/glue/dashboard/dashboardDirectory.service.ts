import { apiService } from '@/app/platform/core/api/api.service.ts';

import type { DashboardDirectoryResponse } from './dashboardDirectory.types.ts';

export const dashboardDirectoryService = {
  get: (): Promise<DashboardDirectoryResponse> =>
    apiService.get<DashboardDirectoryResponse>('/features/glue/dashboard-directory'),
};
