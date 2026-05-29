import { apiService } from '@/platform/core/api/api.service.ts';

import { TabConfigItem, TabWithConfig } from './types.ts';

interface TabConfigResponse {
  context_key: string;
  tab_configs: TabConfigItem[];
}

export const tabConfigService = {
  get: (contextKey: string): Promise<TabConfigResponse> =>
    apiService.get<TabConfigResponse>(
      `/user-tab-configs/${encodeURIComponent(contextKey)}`,
    ),

  save: (
    contextKey: string,
    tabConfigs: TabWithConfig[],
  ): Promise<TabConfigResponse> => {
    const payload: TabConfigItem[] = tabConfigs.map(
      ({ key, visible, order, is_default }) => ({
        key,
        visible,
        order,
        is_default,
      }),
    );
    return apiService.put<TabConfigResponse>(
      `/user-tab-configs/${encodeURIComponent(contextKey)}`,
      { tab_configs: payload },
    );
  },
};
