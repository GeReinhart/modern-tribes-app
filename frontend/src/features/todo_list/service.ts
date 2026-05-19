import { apiService } from '@/services/api.service';
import { TodoItem, TodoItemCreate, TodoItemUpdate } from './types';

class TodoListService {
    async listByInstance(featureInstanceId: string): Promise<TodoItem[]> {
        return apiService.get<TodoItem[]>(`/features/todo-items/by-instance/${featureInstanceId}`);
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
}

export const todoListService = new TodoListService();
