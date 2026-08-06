import { apiService } from '@/app/platform/core/api/api.service.ts';

import {
  GuitarSong,
  GuitarSongCreate,
  GuitarSongDetail,
  GuitarSongUpdate,
} from './types.ts';

const BASE = '/features/tasks/guitar-songs';

export const guitarSongsService = {
  listSongs: (projectId: string): Promise<GuitarSong[]> =>
    apiService.get<GuitarSong[]>(`${BASE}/projects/${projectId}/songs`),

  createSong: (projectId: string, data: GuitarSongCreate): Promise<GuitarSong> =>
    apiService.post<GuitarSong>(`${BASE}/projects/${projectId}/songs`, data),

  getSong: (songId: string): Promise<GuitarSongDetail> =>
    apiService.get<GuitarSongDetail>(`${BASE}/songs/${songId}`),

  updateSong: (songId: string, data: GuitarSongUpdate): Promise<GuitarSong> =>
    apiService.patch<GuitarSong>(`${BASE}/songs/${songId}`, data),

  archiveSong: (songId: string): Promise<void> =>
    apiService.delete<void>(`${BASE}/songs/${songId}`),
};
