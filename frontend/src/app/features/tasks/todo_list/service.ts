import { apiService } from '@/app/platform/core/api/api.service.ts';

import {
  PersonOption,
  TaskReminder,
  TaskReminderCreate,
  TodoItem,
  TodoItemCreate,
  TodoItemUpdate,
  TodoLabel,
  TodoLabelCreate,
  TodoLabelUpdate,
} from './types.ts';

class TodoListService {
  async listByInstance(featureInstanceId: string): Promise<TodoItem[]> {
    return apiService.get<TodoItem[]>(
      `/features/tasks/todo-items/by-instance/${featureInstanceId}`,
    );
  }

  async create(data: TodoItemCreate): Promise<TodoItem> {
    return apiService.post<TodoItem>('/features/tasks/todo-items/', data);
  }

  async update(itemId: string, data: TodoItemUpdate): Promise<TodoItem> {
    return apiService.patch<TodoItem>(`/features/tasks/todo-items/${itemId}`, data);
  }

  async delete(itemId: string): Promise<void> {
    return apiService.delete<void>(`/features/tasks/todo-items/${itemId}`);
  }

  async listLabels(featureInstanceId: string): Promise<TodoLabel[]> {
    return apiService.get<TodoLabel[]>(
      `/features/tasks/todo-labels/by-instance/${featureInstanceId}`,
    );
  }

  async createLabel(data: TodoLabelCreate): Promise<TodoLabel> {
    return apiService.post<TodoLabel>('/features/tasks/todo-labels/', data);
  }

  async updateLabel(labelId: string, data: TodoLabelUpdate): Promise<TodoLabel> {
    return apiService.patch<TodoLabel>(`/features/tasks/todo-labels/${labelId}`, data);
  }

  async deleteLabel(labelId: string): Promise<void> {
    return apiService.delete<void>(`/features/tasks/todo-labels/${labelId}`);
  }

  async toggleLabel(itemId: string, labelId: string): Promise<string[]> {
    return apiService.post<string[]>(
      `/features/tasks/todo-items/${itemId}/labels/${labelId}`,
      {},
    );
  }

  async listPersons(featureInstanceId: string): Promise<PersonOption[]> {
    return apiService.get<PersonOption[]>(
      `/features/tasks/todo-items/persons/${featureInstanceId}`,
    );
  }

  async setReminders(itemId: string, reminders: TaskReminderCreate[]): Promise<TaskReminder[]> {
    return apiService.post<TaskReminder[]>(
      `/features/tasks/todo-items/${itemId}/reminders`,
      reminders,
    );
  }
}

export const todoListService = new TodoListService();
