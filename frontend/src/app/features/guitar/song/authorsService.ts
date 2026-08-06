import { apiService } from '@/app/platform/core/api/api.service.ts';

import { GuitarSongAuthor } from './types.ts';

const BASE = '/features/tasks/guitar-song-authors';

export const guitarSongAuthorsService = {
  listAuthors: (projectId: string): Promise<GuitarSongAuthor[]> =>
    apiService.get<GuitarSongAuthor[]>(`${BASE}/projects/${projectId}`),
};
