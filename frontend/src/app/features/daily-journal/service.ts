import { apiService } from '@/app/platform/core/api/api.service.ts';
import type {
  JournalBlock,
  JournalBlockCreate,
  JournalBlockUpdate,
  JournalBlockReorder,
  JournalLabel,
  JournalLabelCreate,
  JournalLabelUpdate,
  JournalDashboardResponse,
} from './types.ts';

const BASE = '/features/tasks/daily-journal';
const LABELS_BASE = '/features/tasks/journal-labels';

class JournalService {
  async listBlocksForDay(featureInstanceId: string, date: string): Promise<JournalBlock[]> {
    const res = await apiService.get<{ blocks: JournalBlock[] }>(
      `${BASE}/${featureInstanceId}/blocks?date=${date}`,
    );
    return res.blocks;
  }

  async listDays(featureInstanceId: string): Promise<string[]> {
    const res = await apiService.get<{ dates: string[] }>(
      `${BASE}/${featureInstanceId}/days`,
    );
    return res.dates;
  }

  async listBlocksByLabel(featureInstanceId: string, labelId: string): Promise<JournalBlock[]> {
    const res = await apiService.get<{ blocks: JournalBlock[] }>(
      `${BASE}/${featureInstanceId}/blocks/by-label/${labelId}`,
    );
    return res.blocks;
  }

  async createBlock(data: JournalBlockCreate): Promise<JournalBlock> {
    return apiService.post<JournalBlock>(`${BASE}/blocks`, data);
  }

  async updateBlock(blockId: string, data: JournalBlockUpdate): Promise<JournalBlock> {
    return apiService.patch<JournalBlock>(`${BASE}/blocks/${blockId}`, data);
  }

  async deleteBlock(blockId: string): Promise<void> {
    return apiService.delete<void>(`${BASE}/blocks/${blockId}`);
  }

  async reorderBlocks(data: JournalBlockReorder): Promise<void> {
    return apiService.put<void>(`${BASE}/blocks/reorder`, data);
  }

  async toggleLabel(blockId: string, labelId: string): Promise<string[]> {
    return apiService.post<string[]>(`${BASE}/blocks/${blockId}/labels/${labelId}`, {});
  }

  async listLabels(featureInstanceId: string): Promise<JournalLabel[]> {
    return apiService.get<JournalLabel[]>(`${LABELS_BASE}/by-instance/${featureInstanceId}`);
  }

  async createLabel(data: JournalLabelCreate): Promise<JournalLabel> {
    return apiService.post<JournalLabel>(`${LABELS_BASE}/`, data);
  }

  async updateLabel(labelId: string, data: JournalLabelUpdate): Promise<JournalLabel> {
    return apiService.patch<JournalLabel>(`${LABELS_BASE}/${labelId}`, data);
  }

  async deleteLabel(labelId: string): Promise<void> {
    return apiService.delete<void>(`${LABELS_BASE}/${labelId}`);
  }

  async listAccessible(date: string): Promise<JournalDashboardResponse> {
    return apiService.get<JournalDashboardResponse>(`${BASE}/accessible?date=${date}`);
  }

  async listAccessibleDates(year: number, month: number): Promise<string[]> {
    const res = await apiService.get<{ dates: string[] }>(
      `${BASE}/accessible-dates?year=${year}&month=${month}`,
    );
    return res.dates;
  }
}

export const journalService = new JournalService();
