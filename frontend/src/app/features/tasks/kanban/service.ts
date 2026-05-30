import { apiService } from '@/app/platform/core/api/api.service.ts';

import {
  CardCreate,
  CardUpdate,
  ColumnCreate,
  KanbanBoard,
  KanbanCard,
  KanbanColumn,
  KanbanLabel,
  LabelCreate,
  LabelUpdate,
  MoveDirection,
  PersonOption,
  ReorderDirection,
} from './types.ts';

class KanbanService {
  async getBoard(featureInstanceId: string): Promise<KanbanBoard> {
    return apiService.get<KanbanBoard>(
      `/features/tasks/kanban/board/${featureInstanceId}`,
    );
  }

  async getPersons(featureInstanceId: string): Promise<PersonOption[]> {
    return apiService.get<PersonOption[]>(
      `/features/tasks/kanban/persons/${featureInstanceId}`,
    );
  }

  async createColumn(data: ColumnCreate): Promise<KanbanColumn> {
    return apiService.post<KanbanColumn>('/features/tasks/kanban/columns', data);
  }

  async renameColumn(columnId: string, name: string): Promise<KanbanColumn> {
    return apiService.patch<KanbanColumn>(
      `/features/tasks/kanban/columns/${columnId}`,
      { name },
    );
  }

  async moveColumn(
    columnId: string,
    direction: MoveDirection,
  ): Promise<KanbanColumn[]> {
    return apiService.post<KanbanColumn[]>(
      `/features/tasks/kanban/columns/${columnId}/move`,
      { direction },
    );
  }

  async deleteColumn(columnId: string): Promise<void> {
    return apiService.delete<void>(`/features/tasks/kanban/columns/${columnId}`);
  }

  async createCard(data: CardCreate): Promise<KanbanCard> {
    return apiService.post<KanbanCard>('/features/tasks/kanban/cards', data);
  }

  async updateCard(cardId: string, data: CardUpdate): Promise<KanbanCard> {
    return apiService.patch<KanbanCard>(
      `/features/tasks/kanban/cards/${cardId}`,
      data,
    );
  }

  async archiveCard(cardId: string): Promise<void> {
    return apiService.delete<void>(`/features/tasks/kanban/cards/${cardId}`);
  }

  async restoreCard(cardId: string): Promise<KanbanCard> {
    return apiService.post<KanbanCard>(
      `/features/tasks/kanban/cards/${cardId}/restore`,
      {},
    );
  }

  async moveCard(
    cardId: string,
    direction: MoveDirection,
  ): Promise<KanbanCard[]> {
    return apiService.post<KanbanCard[]>(
      `/features/tasks/kanban/cards/${cardId}/move`,
      { direction },
    );
  }

  async reorderCard(
    cardId: string,
    direction: ReorderDirection,
  ): Promise<KanbanCard[]> {
    return apiService.post<KanbanCard[]>(
      `/features/tasks/kanban/cards/${cardId}/reorder`,
      { direction },
    );
  }

  async createLabel(data: LabelCreate): Promise<KanbanLabel> {
    return apiService.post<KanbanLabel>('/features/tasks/kanban/labels', data);
  }

  async updateLabel(labelId: string, data: LabelUpdate): Promise<KanbanLabel> {
    return apiService.patch<KanbanLabel>(
      `/features/tasks/kanban/labels/${labelId}`,
      data,
    );
  }

  async deleteLabel(labelId: string): Promise<void> {
    return apiService.delete<void>(`/features/tasks/kanban/labels/${labelId}`);
  }

  async addCardLabel(cardId: string, labelId: string): Promise<KanbanCard> {
    return apiService.post<KanbanCard>(
      `/features/tasks/kanban/cards/${cardId}/labels/${labelId}`,
      {},
    );
  }

  async removeCardLabel(cardId: string, labelId: string): Promise<KanbanCard> {
    return apiService.delete<KanbanCard>(
      `/features/tasks/kanban/cards/${cardId}/labels/${labelId}`,
    );
  }
}

export const kanbanService = new KanbanService();
