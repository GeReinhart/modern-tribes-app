import { apiService } from '@/app/platform/core/api/api.service.ts';

import { GuitarChord, GuitarChordCreate, GuitarChordUpdate } from './types.ts';

export const guitarChordsService = {
  listChords: (): Promise<GuitarChord[]> =>
    apiService.get<GuitarChord[]>('/features/tasks/guitar-chords/'),

  createChord: (data: GuitarChordCreate): Promise<GuitarChord> =>
    apiService.post<GuitarChord>('/features/tasks/guitar-chords/', data),

  updateChord: (chordId: string, data: GuitarChordUpdate): Promise<GuitarChord> =>
    apiService.patch<GuitarChord>(`/features/tasks/guitar-chords/${chordId}`, data),

  deleteChord: (chordId: string): Promise<void> =>
    apiService.delete<void>(`/features/tasks/guitar-chords/${chordId}`),
};
