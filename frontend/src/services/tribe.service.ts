import { apiService } from './api.service';
import {
    Tribe,
    TribeCreate,
    TribeUpdate,
    TribeWithPersonsWithPosition,
    TribeWithPositions,
    TribeWithProjects
} from '../types/tribe.types';
import {UserPersonPositionTribe} from "@/types/queries/tribes.query.types.ts";

class TribeService {
    private endpoint = '/crud/tribes';
    private queryEndpoint = '/query/tribes';

    async getAll(): Promise<Tribe[]> {
        return apiService.get<Tribe[]>(this.endpoint);
    }

    async getAllByUser(userId: string): Promise<UserPersonPositionTribe[]> {

        return apiService.get<UserPersonPositionTribe[]>(`${this.queryEndpoint}/by/user/${userId}`);
    }


    async getById(id: string): Promise<Tribe> {
        return apiService.get<Tribe>(`${this.endpoint}/${id}`);
    }

    async getTribePositions(id: string): Promise<TribeWithPositions> {
        return apiService.get<TribeWithPositions>(`${this.endpoint}/${id}/positions`);
    }

    async getTribePersonsPosition(id: string): Promise<TribeWithPersonsWithPosition> {
        return apiService.get<TribeWithPersonsWithPosition>(`${this.endpoint}/${id}/persons`);
    }

    async getTribeProjects(id: string): Promise<TribeWithProjects> {
        return apiService.get<TribeWithProjects>(`${this.endpoint}/${id}/projects`);
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