import { apiService } from '@/app/platform/core/api/api.service.ts';

import { PinnedTab, PinnedTabCreate, PinnedTabsResponse } from './pinnedTabs.types.ts';

export const pinnedTabsService = {
  list: (): Promise<PinnedTabsResponse> =>
    apiService.get<PinnedTabsResponse>('/features/glue/dashboard/pinned-tabs'),

  pin: (data: PinnedTabCreate): Promise<PinnedTab> =>
    apiService.post<PinnedTab>('/features/glue/dashboard/pinned-tabs', data),

  unpin: (pinnedTabId: string): Promise<void> =>
    apiService.delete<void>(`/features/glue/dashboard/pinned-tabs/${pinnedTabId}`),
};
