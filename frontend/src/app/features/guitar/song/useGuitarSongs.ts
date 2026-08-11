import { useCallback, useEffect, useState } from 'react';

import { guitarSongsService } from './service.ts';
import { GuitarSong, GuitarSongListFilters } from './types.ts';

export const useGuitarSongs = (projectId: string, filters: GuitarSongListFilters = {}) => {
  const [songs, setSongs] = useState<GuitarSong[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const { q, labelIds, songStates, difficulties, masteries } = filters;

  const reload = useCallback(async () => {
    setLoading(true);
    setError(null);
    try {
      setSongs(await guitarSongsService.listSongs(projectId, { q, labelIds, songStates, difficulties, masteries }));
    } catch {
      setError('error');
    } finally {
      setLoading(false);
    }
  }, [projectId, q, labelIds, songStates, difficulties, masteries]);

  useEffect(() => { reload(); }, [reload]);
  return { songs, loading, error, reload };
};
