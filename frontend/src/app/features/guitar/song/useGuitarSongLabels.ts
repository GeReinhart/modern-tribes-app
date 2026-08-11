import { useEffect, useState } from 'react';

import { guitarSongLabelsService } from './labelsService.ts';
import { GuitarSongLabel, GuitarSongLabelCreate, GuitarSongLabelUpdate } from './types.ts';

export const useGuitarSongLabels = (projectId: string | null) => {
  const [labels, setLabels] = useState<GuitarSongLabel[]>([]);
  const [loading, setLoading] = useState(!!projectId);

  const reload = async () => {
    if (!projectId) return;
    setLoading(true);
    try {
      setLabels(await guitarSongLabelsService.listLabels(projectId));
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => { reload(); }, [projectId]);

  const createLabel = async (data: GuitarSongLabelCreate) => {
    if (!projectId) return;
    await guitarSongLabelsService.createLabel(projectId, data);
    await reload();
  };

  const updateLabel = async (labelId: string, data: GuitarSongLabelUpdate) => {
    await guitarSongLabelsService.updateLabel(labelId, data);
    await reload();
  };

  const deleteLabel = async (labelId: string) => {
    await guitarSongLabelsService.deleteLabel(labelId);
    await reload();
  };

  const reorderLabels = async (orderedIds: string[]) => {
    if (!projectId) return;
    setLabels(await guitarSongLabelsService.reorderLabels(projectId, orderedIds));
  };

  return { labels, loading, reload, createLabel, updateLabel, deleteLabel, reorderLabels };
};
