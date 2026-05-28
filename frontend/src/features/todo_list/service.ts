import { apiService } from '@/platform/api/api.service.ts';
import { PersonOption } from './types';

import {
  TodoItem,
  TodoItemCreate,
  TodoItemUpdate,
  TodoLabel,
  TodoLabelCreate,
  TodoLabelUpdate,
} from './types';

class TodoListService {
  async listByInstance(featureInstanceId: string): Promise<TodoItem[]> {
    return apiService.get<TodoItem[]>(
      `/features/todo-items/by-instance/${featureInstanceId}`,
    );
  }

  async create(data: TodoItemCreate): Promise<TodoItem> {
    return apiService.post<TodoItem>('/features/todo-items/', data);
  }

  async update(itemId: string, data: TodoItemUpdate): Promise<TodoItem> {
    return apiService.patch<TodoItem>(`/features/todo-items/${itemId}`, data);
  }

  async delete(itemId: string): Promise<void> {
    return apiService.delete<void>(`/features/todo-items/${itemId}`);
  }

  async listLabels(featureInstanceId: string): Promise<TodoLabel[]> {
    return apiService.get<TodoLabel[]>(
      `/features/todo-labels/by-instance/${featureInstanceId}`,
    );
  }

  async createLabel(data: TodoLabelCreate): Promise<TodoLabel> {
    return apiService.post<TodoLabel>('/features/todo-labels/', data);
  }

  async updateLabel(labelId: string, data: TodoLabelUpdate): Promise<void> {
    return apiService.patch<void>(`/features/todo-labels/${labelId}`, data);
  }

  async deleteLabel(labelId: string): Promise<void> {
    return apiService.delete<void>(`/features/todo-labels/${labelId}`);
  }

  async toggleLabel(itemId: string, labelId: string): Promise<string[]> {
    return apiService.post<string[]>(
      `/features/todo-items/${itemId}/labels/${labelId}`,
      {},
    );
  }

  async listPersons(featureInstanceId: string): Promise<PersonOption[]> {
    return apiService.get<PersonOption[]>(
      `/features/todo-items/persons/${featureInstanceId}`,
    );
  }
}

export const todoListService = new TodoListService();
