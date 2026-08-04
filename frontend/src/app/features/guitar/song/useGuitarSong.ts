import { useEffect, useState } from 'react';

import { guitarSongsService } from './service.ts';
import { GuitarSongChordCreate, GuitarSongChordUpdate, GuitarSongDetail, MoveDirection } from './types.ts';

export const useGuitarSong = (songId: string) => {
  const [song, setSong] = useState<GuitarSongDetail | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const reload = async () => {
    setLoading(true);
    setError(null);
    try {
      setSong(await guitarSongsService.getSong(songId));
    } catch {
      setError('error');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => { reload(); }, [songId]);

  const addChord = async (data: GuitarSongChordCreate) => {
    await guitarSongsService.addChordToSong(songId, data);
    await reload();
  };

  const updateComment = async (songChordId: string, data: GuitarSongChordUpdate) => {
    await guitarSongsService.updateSongChordComment(songChordId, data);
    await reload();
  };

  const moveChord = async (songChordId: string, direction: MoveDirection) => {
    await guitarSongsService.moveSongChord(songChordId, direction);
    await reload();
  };

  const removeChord = async (songChordId: string) => {
    await guitarSongsService.removeSongChord(songChordId);
    await reload();
  };

  return { song, loading, error, reload, addChord, updateComment, moveChord, removeChord };
};
