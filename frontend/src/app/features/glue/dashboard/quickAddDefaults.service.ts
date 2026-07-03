import { apiService } from '@/app/platform/core/api/api.service.ts';

import type { QuickAddDefaultEntry, QuickAddDefaultsResponse, QuickAddType } from './quickAddDefaults.types.ts';

export const quickAddDefaultsService = {
  get: (): Promise<QuickAddDefaultsResponse> =>
    apiService.get<QuickAddDefaultsResponse>('/features/glue/dashboard/quick-add-defaults'),

  set: (quickAddType: QuickAddType, featureInstanceId: string | null): Promise<QuickAddDefaultEntry> =>
    apiService.put<QuickAddDefaultEntry>(
      `/features/glue/dashboard/quick-add-defaults/${quickAddType}`,
      { feature_instance_id: featureInstanceId },
    ),
};
