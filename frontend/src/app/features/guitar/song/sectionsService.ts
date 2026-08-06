import { apiService } from '@/app/platform/core/api/api.service.ts';

import {
  GuitarSongSection,
  GuitarSongSectionChord,
  GuitarSongSectionChordCreate,
  GuitarSongSectionCreate,
  GuitarSongSectionLyricsUpdate,
  GuitarSongSectionUpdate,
  GuitarSongSectionWord,
  GuitarSongSectionWordChordUpdate,
  MoveDirection,
  WordChordPosition,
} from './types.ts';

const BASE = '/features/tasks/guitar-songs';

export const guitarSongSectionsService = {
  createSection: (songId: string, data: GuitarSongSectionCreate): Promise<GuitarSongSection> =>
    apiService.post<GuitarSongSection>(`${BASE}/songs/${songId}/sections`, data),

  updateSection: (sectionId: string, data: GuitarSongSectionUpdate): Promise<GuitarSongSection> =>
    apiService.patch<GuitarSongSection>(`${BASE}/sections/${sectionId}`, data),

  moveSection: (sectionId: string, direction: MoveDirection): Promise<GuitarSongSection[]> =>
    apiService.post<GuitarSongSection[]>(`${BASE}/sections/${sectionId}/move`, { direction }),

  archiveSection: (sectionId: string): Promise<void> =>
    apiService.delete<void>(`${BASE}/sections/${sectionId}`),

  duplicateSection: (sectionId: string): Promise<GuitarSongSection> =>
    apiService.post<GuitarSongSection>(`${BASE}/sections/${sectionId}/duplicate`, {}),

  updateLyrics: (sectionId: string, data: GuitarSongSectionLyricsUpdate): Promise<GuitarSongSection> =>
    apiService.patch<GuitarSongSection>(`${BASE}/sections/${sectionId}/lyrics`, data),

  setWordChord: (
    wordId: string, position: WordChordPosition, data: GuitarSongSectionWordChordUpdate,
  ): Promise<GuitarSongSectionWord> =>
    apiService.patch<GuitarSongSectionWord>(`${BASE}/section-words/${wordId}/chords/${position}`, data),

  addChordToSection: (sectionId: string, data: GuitarSongSectionChordCreate): Promise<GuitarSongSectionChord> =>
    apiService.post<GuitarSongSectionChord>(`${BASE}/sections/${sectionId}/chords`, data),

  moveSectionChord: (sectionChordId: string, direction: MoveDirection): Promise<GuitarSongSectionChord[]> =>
    apiService.post<GuitarSongSectionChord[]>(`${BASE}/section-chords/${sectionChordId}/move`, { direction }),

  removeSectionChord: (sectionChordId: string): Promise<void> =>
    apiService.delete<void>(`${BASE}/section-chords/${sectionChordId}`),
};
