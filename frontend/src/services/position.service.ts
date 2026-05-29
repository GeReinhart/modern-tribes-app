import {
  Position,
  PositionCreate,
  PositionUpdate,
} from '../types/position.types';
import { apiService } from '@/platform/core/api/api.service.ts';

class PositionService {
  private endpoint = '/crud/positions';

  async getAll(): Promise<Position[]> {
    return apiService.get<Position[]>(this.endpoint);
  }

  async getAllByTribeId(tribe_id: string): Promise<Position[]> {
    return apiService.get<Position[]>(`${this.endpoint}/by/tribe/${tribe_id}`);
  }

  async getById(id: string): Promise<Position> {
    return apiService.get<Position>(`${this.endpoint}/${id}`);
  }

  async create(data: PositionCreate): Promise<Position> {
    return apiService.post<Position>(this.endpoint, data);
  }

  async update(id: string, data: PositionUpdate): Promise<Position> {
    return apiService.put<Position>(`${this.endpoint}/${id}`, data);
  }

  async updateByForeignIds(
    person_id: string,
    tribe_id: string,
    data: PositionUpdate,
  ): Promise<Position> {
    return apiService.put<Position>(
      `${this.endpoint}/by/foreign_ids/${person_id}/${tribe_id}`,
      data,
    );
    // TODO Implement it on backend
  }

  async delete(id: string): Promise<void> {
    return apiService.delete<void>(`${this.endpoint}/${id}`);
  }

  async deleteByForeignIds(person_id: string, tribe_id: string): Promise<void> {
    return apiService.delete<void>(
      `${this.endpoint}/by/foreign_ids/${person_id}/${tribe_id}`,
    );
    // TODO Implement it on backend
  }
}

export const positionService = new PositionService();
