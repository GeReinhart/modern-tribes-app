import { apiService } from '@/platform/core/api/api.service.ts';

import { Authorization, PermissionEnum } from './authorization-types.ts';

export const authorizationService = {
  verifyAuthorization: async (
    permissions: PermissionEnum[],
    tribe_id?: string,
    position?: string,
  ): Promise<Authorization> => {
    const permissionsStr = permissions.join(',');

    let url = `/auth/permissions/any/${permissionsStr}`;

    if (tribe_id) {
      url += `/own/tribe/${tribe_id}`;

      if (position) {
        url += `/position/${position}`;
      }
    }

    return apiService.get<Authorization>(url);
  },
};
