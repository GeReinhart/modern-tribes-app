import {
  TribeWithPositionsCreate,
  TribeWithPositionsResponse,
  TribeWithPositionsUpdate,
} from '@/app/features/tribes-projects/tribes/tribe_with_positions.types.ts';

import { apiService } from '@/app/platform/core/api/api.service.ts';

export const tribeWithPositionService = {
  async createWithPositions(
    data: TribeWithPositionsCreate,
  ): Promise<TribeWithPositionsResponse> {
    const response = await apiService.post<TribeWithPositionsResponse>(
      '/features/tribes-projects/tribes/with-positions',
      data,
    );
    return response;
  },

  async getWithPositions(id: string): Promise<TribeWithPositionsResponse> {
    const response = await apiService.get<TribeWithPositionsResponse>(
      `/features/tribes-projects/tribes/${id}/with-positions`,
    );
    return response;
  },

  async updateWithPositions(
    id: string,
    data: TribeWithPositionsUpdate,
  ): Promise<TribeWithPositionsResponse> {
    const response = await apiService.put<TribeWithPositionsResponse>(
      `/features/tribes-projects/tribes/${id}/with-positions`,
      data,
    );
    return response;
  },

  async archiveTribe(id: string): Promise<void> {
    await apiService.patch<void>(`/features/tribes-projects/tribes/${id}/archive`);
  },
};
