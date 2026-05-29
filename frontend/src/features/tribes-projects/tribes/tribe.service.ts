import { UserPersonPositionTribe } from '@/types/queries/tribes.query.types.ts';

import {
  Tribe,
  TribeCreate,
  TribeProject,
  TribeProjectInput,
  TribeUpdate,
  TribeWithPersonsWithPosition,
  TribeWithPositions,
} from '@/types/tribe.types.ts';
import { apiService } from '@/platform/core/api/api.service.ts';

class TribeService {
  private endpoint = '/crud/tribes';
  private queryEndpoint = '/query/tribes';

  async getAll(): Promise<Tribe[]> {
    return apiService.get<Tribe[]>(this.endpoint);
  }

  async getAllByUser(userId: string): Promise<UserPersonPositionTribe[]> {
    return apiService.get<UserPersonPositionTribe[]>(
      `${this.queryEndpoint}/by/user/${userId}`,
    );
  }

  async getById(id: string): Promise<Tribe> {
    return apiService.get<Tribe>(`${this.endpoint}/${id}`);
  }

  async getTribePositions(id: string): Promise<TribeWithPositions> {
    return apiService.get<TribeWithPositions>(
      `${this.endpoint}/${id}/positions`,
    );
  }

  async getTribePersonsPosition(
    id: string,
  ): Promise<TribeWithPersonsWithPosition> {
    return apiService.get<TribeWithPersonsWithPosition>(
      `${this.endpoint}/${id}/persons`,
    );
  }

  async getTribeProjects(id: string): Promise<TribeProject[]> {
    return apiService.get<TribeProject[]>(`${this.endpoint}/${id}/projects`);
  }

  async syncTribeProjects(
    id: string,
    projects: TribeProjectInput[],
  ): Promise<TribeProject[]> {
    return apiService.put<TribeProject[]>(
      `${this.endpoint}/${id}/projects`,
      projects,
    );
  }

  async create(data: TribeCreate): Promise<Tribe> {
    return apiService.post<Tribe>(this.endpoint, data);
  }

  async update(id: string, data: TribeUpdate): Promise<Tribe> {
    return apiService.put<Tribe>(`${this.endpoint}/${id}`, data);
  }

  async delete(id: string): Promise<void> {
    return apiService.delete<void>(`${this.endpoint}/${id}`);
  }
}

export const tribeService = new TribeService();
