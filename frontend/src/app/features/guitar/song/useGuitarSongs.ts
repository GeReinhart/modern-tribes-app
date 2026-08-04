import { useEffect, useState } from 'react';

import { guitarSongsService } from './service.ts';
import { GuitarSong } from './types.ts';

export const useGuitarSongs = (projectId: string) => {
  const [songs, setSongs] = useState<GuitarSong[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const reload = async () => {
    setLoading(true);
    setError(null);
    try {
      setSongs(await guitarSongsService.listSongs(projectId));
    } catch {
      setError('error');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => { reload(); }, [projectId]);
  return { songs, loading, error, reload };
};
