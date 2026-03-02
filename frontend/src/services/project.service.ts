import { apiService } from './api.service';
import { Project, ProjectCreate, ProjectUpdate } from '../types/project.types';

class ProjectService {
    private endpoint = '/crud/projects';

    async getAll(): Promise<Project[]> {
        return apiService.get<Project[]>(this.endpoint);
    }

    async getById(id: string): Promise<Project> {
        return apiService.get<Project>(`${this.endpoint}/${id}`);
    }


    async create(data: ProjectCreate): Promise<Project> {
        return apiService.post<Project>(this.endpoint, data);
    }

    async update(id: string, data: ProjectUpdate): Promise<Project> {
        return apiService.put<Project>(`${this.endpoint}/${id}`, data);
    }

    async delete(id: string): Promise<void> {
        return apiService.delete<void>(`${this.endpoint}/${id}`);
    }
}

export const projectService = new ProjectService();