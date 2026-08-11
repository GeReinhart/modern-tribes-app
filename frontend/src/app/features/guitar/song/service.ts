import { apiService } from '@/app/platform/core/api/api.service.ts';

import {
  GuitarSong,
  GuitarSongCreate,
  GuitarSongDetail,
  GuitarSongListFilters,
  GuitarSongUpdate,
} from './types.ts';

const BASE = '/features/tasks/guitar-songs';

function buildSongListQuery(filters: GuitarSongListFilters): string {
  const params = new URLSearchParams();
  if (filters.q) params.set('q', filters.q);
  (filters.labelIds || []).forEach((id) => params.append('label_id', id));
  (filters.songStates || []).forEach((state) => params.append('song_state', state));
  (filters.difficulties || []).forEach((level) => params.append('difficulty', String(level)));
  (filters.masteries || []).forEach((level) => params.append('mastery', String(level)));
  return params.toString() ? `?${params.toString()}` : '';
}

export const guitarSongsService = {
  listSongs: (projectId: string, filters: GuitarSongListFilters = {}): Promise<GuitarSong[]> =>
    apiService.get<GuitarSong[]>(`${BASE}/projects/${projectId}/songs${buildSongListQuery(filters)}`),

  createSong: (projectId: string, data: GuitarSongCreate): Promise<GuitarSong> =>
    apiService.post<GuitarSong>(`${BASE}/projects/${projectId}/songs`, data),

  getSong: (songId: string): Promise<GuitarSongDetail> =>
    apiService.get<GuitarSongDetail>(`${BASE}/songs/${songId}`),

  updateSong: (songId: string, data: GuitarSongUpdate): Promise<GuitarSong> =>
    apiService.patch<GuitarSong>(`${BASE}/songs/${songId}`, data),

  setMyMastery: (songId: string, masteryLevel: number): Promise<{ my_mastery: number }> =>
    apiService.put<{ my_mastery: number }>(`${BASE}/songs/${songId}/mastery`, { mastery_level: masteryLevel }),

  archiveSong: (songId: string): Promise<void> =>
    apiService.delete<void>(`${BASE}/songs/${songId}`),
};
