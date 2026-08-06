import { apiService } from '@/app/platform/core/api/api.service.ts';

import { GuitarSongLabel, GuitarSongLabelCreate, GuitarSongLabelUpdate } from './types.ts';

const BASE = '/features/tasks/guitar-songs';

export const guitarSongLabelsService = {
  listLabels: (projectId: string): Promise<GuitarSongLabel[]> =>
    apiService.get<GuitarSongLabel[]>(`${BASE}/projects/${projectId}/song-labels`),

  createLabel: (projectId: string, data: GuitarSongLabelCreate): Promise<GuitarSongLabel> =>
    apiService.post<GuitarSongLabel>(`${BASE}/projects/${projectId}/song-labels`, data),

  updateLabel: (labelId: string, data: GuitarSongLabelUpdate): Promise<GuitarSongLabel> =>
    apiService.patch<GuitarSongLabel>(`${BASE}/song-labels/${labelId}`, data),

  deleteLabel: (labelId: string): Promise<void> =>
    apiService.delete<void>(`${BASE}/song-labels/${labelId}`),

  addLabelToSong: (songId: string, labelId: string): Promise<void> =>
    apiService.post<void>(`${BASE}/songs/${songId}/labels/${labelId}`, {}),

  removeLabelFromSong: (songId: string, labelId: string): Promise<void> =>
    apiService.delete<void>(`${BASE}/songs/${songId}/labels/${labelId}`),
};
