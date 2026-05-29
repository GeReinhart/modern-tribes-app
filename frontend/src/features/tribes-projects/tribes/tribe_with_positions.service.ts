import {
  TribeWithPositionsCreate,
  TribeWithPositionsResponse,
  TribeWithPositionsUpdate,
} from '@/features/tribes-projects/tribes/tribe_with_positions.types.ts';

import { apiService } from '@/platform/core/api/api.service.ts';

export const tribeWithPositionService = {
  async createWithPositions(
    data: TribeWithPositionsCreate,
  ): Promise<TribeWithPositionsResponse> {
    const response = await apiService.post<TribeWithPositionsResponse>(
      '/tribes/with-positions',
      data,
    );
    return response;
  },

  async getWithPositions(id: string): Promise<TribeWithPositionsResponse> {
    const response = await apiService.get<TribeWithPositionsResponse>(
      `/tribes/${id}/with-positions`,
    );
    return response;
  },

  async updateWithPositions(
    id: string,
    data: TribeWithPositionsUpdate,
  ): Promise<TribeWithPositionsResponse> {
    const response = await apiService.put<TribeWithPositionsResponse>(
      `/tribes/${id}/with-positions`,
      data,
    );
    return response;
  },

  async archiveTribe(id: string): Promise<void> {
    await apiService.patch<void>(`/tribes/${id}/archive`);
  },
};
