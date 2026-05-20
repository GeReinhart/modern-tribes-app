import { apiService } from '@/services/api.service';
import { KanbanBoard, KanbanCard, KanbanColumn, PersonOption, CardCreate, CardUpdate, ColumnCreate, MoveDirection } from './types';

class KanbanService {
    async getBoard(featureInstanceId: string): Promise<KanbanBoard> {
        return apiService.get<KanbanBoard>(`/features/kanban/board/${featureInstanceId}`);
    }

    async getPersons(featureInstanceId: string): Promise<PersonOption[]> {
        return apiService.get<PersonOption[]>(`/features/kanban/persons/${featureInstanceId}`);
    }

    async createColumn(data: ColumnCreate): Promise<KanbanColumn> {
        return apiService.post<KanbanColumn>('/features/kanban/columns', data);
    }

    async renameColumn(columnId: string, name: string): Promise<KanbanColumn> {
        return apiService.patch<KanbanColumn>(`/features/kanban/columns/${columnId}`, { name });
    }

    async moveColumn(columnId: string, direction: MoveDirection): Promise<KanbanColumn[]> {
        return apiService.post<KanbanColumn[]>(`/features/kanban/columns/${columnId}/move`, { direction });
    }

    async deleteColumn(columnId: string): Promise<void> {
        return apiService.delete<void>(`/features/kanban/columns/${columnId}`);
    }

    async createCard(data: CardCreate): Promise<KanbanCard> {
        return apiService.post<KanbanCard>('/features/kanban/cards', data);
    }

    async updateCard(cardId: string, data: CardUpdate): Promise<KanbanCard> {
        return apiService.patch<KanbanCard>(`/features/kanban/cards/${cardId}`, data);
    }

    async archiveCard(cardId: string): Promise<void> {
        return apiService.delete<void>(`/features/kanban/cards/${cardId}`);
    }

    async moveCard(cardId: string, direction: 'prev' | 'next'): Promise<KanbanCard[]> {
        return apiService.post<KanbanCard[]>(`/features/kanban/cards/${cardId}/move`, { direction });
    }
}

export const kanbanService = new KanbanService();
