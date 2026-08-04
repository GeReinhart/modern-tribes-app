import { apiService } from '@/app/platform/core/api/api.service.ts';

import {
  GuitarSong,
  GuitarSongChord,
  GuitarSongChordCreate,
  GuitarSongChordUpdate,
  GuitarSongCreate,
  GuitarSongDetail,
  GuitarSongUpdate,
  MoveDirection,
} from './types.ts';

const BASE = '/features/tasks/guitar-songs';

export const guitarSongsService = {
  listSongs: (featureInstanceId: string): Promise<GuitarSong[]> =>
    apiService.get<GuitarSong[]>(`${BASE}/instances/${featureInstanceId}/songs`),

  createSong: (featureInstanceId: string, data: GuitarSongCreate): Promise<GuitarSong> =>
    apiService.post<GuitarSong>(`${BASE}/instances/${featureInstanceId}/songs`, data),

  getSong: (songId: string): Promise<GuitarSongDetail> =>
    apiService.get<GuitarSongDetail>(`${BASE}/songs/${songId}`),

  updateSong: (songId: string, data: GuitarSongUpdate): Promise<GuitarSong> =>
    apiService.patch<GuitarSong>(`${BASE}/songs/${songId}`, data),

  archiveSong: (songId: string): Promise<void> =>
    apiService.delete<void>(`${BASE}/songs/${songId}`),

  addChordToSong: (songId: string, data: GuitarSongChordCreate): Promise<GuitarSongChord> =>
    apiService.post<GuitarSongChord>(`${BASE}/songs/${songId}/chords`, data),

  updateSongChordComment: (songChordId: string, data: GuitarSongChordUpdate): Promise<GuitarSongChord> =>
    apiService.patch<GuitarSongChord>(`${BASE}/song-chords/${songChordId}`, data),

  moveSongChord: (songChordId: string, direction: MoveDirection): Promise<GuitarSongChord[]> =>
    apiService.post<GuitarSongChord[]>(`${BASE}/song-chords/${songChordId}/move`, { direction }),

  removeSongChord: (songChordId: string): Promise<void> =>
    apiService.delete<void>(`${BASE}/song-chords/${songChordId}`),
};
