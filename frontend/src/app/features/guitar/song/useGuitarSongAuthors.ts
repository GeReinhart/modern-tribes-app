import { useEffect, useState } from 'react';

import { guitarSongAuthorsService } from './authorsService.ts';
import { GuitarSongAuthor } from './types.ts';

export const useGuitarSongAuthors = (projectId: string | null) => {
  const [authors, setAuthors] = useState<GuitarSongAuthor[]>([]);

  useEffect(() => {
    if (!projectId) return;
    let cancelled = false;
    guitarSongAuthorsService.listAuthors(projectId).then((result) => {
      if (!cancelled) setAuthors(result);
    });
    return () => { cancelled = true; };
  }, [projectId]);

  return authors;
};
