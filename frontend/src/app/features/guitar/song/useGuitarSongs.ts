import { useEffect, useState } from 'react';

import { guitarSongsService } from './service.ts';
import { GuitarSong, GuitarSongDetail } from './types.ts';

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

  const duplicateSong = async (songId: string): Promise<GuitarSongDetail> => {
    const duplicated = await guitarSongsService.duplicateSong(songId);
    await reload();
    return duplicated;
  };

  useEffect(() => { reload(); }, [projectId]);
  return { songs, loading, error, reload, duplicateSong };
};
