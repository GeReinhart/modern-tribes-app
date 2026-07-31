import { useEffect, useState } from 'react';

import { guitarChordsService } from './service.ts';
import { GuitarChord } from './types.ts';

export const useGuitarChords = () => {
  const [chords, setChords] = useState<GuitarChord[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const reload = async () => {
    setLoading(true);
    setError(null);
    try {
      setChords(await guitarChordsService.listChords());
    } catch {
      setError('error');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => { reload(); }, []);
  return { chords, loading, error, reload };
};
