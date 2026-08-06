import { apiService } from '@/app/platform/core/api/api.service.ts';

import { GuitarSongVideo, GuitarSongVideoCreate, GuitarSongVideoUpdate, MoveDirection } from './types.ts';

const BASE = '/features/tasks/guitar-songs';

export const guitarSongVideosService = {
  addVideo: (songId: string, data: GuitarSongVideoCreate): Promise<GuitarSongVideo> =>
    apiService.post<GuitarSongVideo>(`${BASE}/songs/${songId}/videos`, data),

  updateVideo: (videoId: string, data: GuitarSongVideoUpdate): Promise<GuitarSongVideo> =>
    apiService.patch<GuitarSongVideo>(`${BASE}/videos/${videoId}`, data),

  moveVideo: (videoId: string, direction: MoveDirection): Promise<GuitarSongVideo[]> =>
    apiService.post<GuitarSongVideo[]>(`${BASE}/videos/${videoId}/move`, { direction }),

  removeVideo: (videoId: string): Promise<void> =>
    apiService.delete<void>(`${BASE}/videos/${videoId}`),
};
