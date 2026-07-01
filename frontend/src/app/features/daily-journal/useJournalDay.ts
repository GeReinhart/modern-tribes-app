import { useCallback, useEffect, useState } from 'react';
import { journalService } from './service.ts';
import type { JournalBlock, JournalLabel } from './types.ts';

interface UseJournalDayResult {
  blocks: JournalBlock[];
  labels: JournalLabel[];
  days: string[];
  loading: boolean;
  error: string | null;
  createBlock: (position: number, contentHtml: string) => Promise<void>;
  updateBlock: (blockId: string, contentHtml: string) => Promise<void>;
  deleteBlock: (blockId: string) => Promise<void>;
  reorderBlocks: (orderedIds: string[]) => Promise<void>;
  toggleLabel: (blockId: string, labelId: string) => Promise<void>;
  createLabel: (name: string, color: string) => Promise<JournalLabel | null>;
  updateLabel: (labelId: string, name: string, color: string) => Promise<void>;
  deleteLabel: (labelId: string) => Promise<void>;
}

export function useJournalDay(
  featureInstanceId: string,
  selectedDate: string,
): UseJournalDayResult {
  const [blocks, setBlocks] = useState<JournalBlock[]>([]);
  const [labels, setLabels] = useState<JournalLabel[]>([]);
  const [days, setDays] = useState<string[]>([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const loadBlocks = useCallback(async () => {
    setLoading(true);
    try {
      const data = await journalService.listBlocksForDay(featureInstanceId, selectedDate);
      setBlocks(data);
    } catch {
      setError('Failed to load journal blocks.');
    } finally {
      setLoading(false);
    }
  }, [featureInstanceId, selectedDate]);

  const loadDays = useCallback(async () => {
    try {
      const data = await journalService.listDays(featureInstanceId);
      setDays(data);
    } catch {
      // non-blocking
    }
  }, [featureInstanceId]);

  const loadLabels = useCallback(async () => {
    try {
      const data = await journalService.listLabels(featureInstanceId);
      setLabels(data);
    } catch {
      // non-blocking
    }
  }, [featureInstanceId]);

  useEffect(() => {
    loadBlocks();
  }, [loadBlocks]);

  useEffect(() => {
    loadDays();
    loadLabels();
  }, [loadDays, loadLabels]);

  const createBlock = useCallback(async (position: number, contentHtml: string) => {
    await journalService.createBlock({ feature_instance_id: featureInstanceId, date: selectedDate, position, content_html: contentHtml });
    await Promise.all([loadBlocks(), loadDays()]);
  }, [featureInstanceId, selectedDate, loadBlocks, loadDays]);

  const updateBlock = useCallback(async (blockId: string, contentHtml: string) => {
    await journalService.updateBlock(blockId, { content_html: contentHtml });
    await loadBlocks();
  }, [loadBlocks]);

  const deleteBlock = useCallback(async (blockId: string) => {
    await journalService.deleteBlock(blockId);
    await Promise.all([loadBlocks(), loadDays()]);
  }, [loadBlocks, loadDays]);

  const reorderBlocks = useCallback(async (orderedIds: string[]) => {
    await journalService.reorderBlocks({ feature_instance_id: featureInstanceId, date: selectedDate, ordered_ids: orderedIds });
    await loadBlocks();
  }, [featureInstanceId, selectedDate, loadBlocks]);

  const toggleLabel = useCallback(async (blockId: string, labelId: string) => {
    const newLabelIds = await journalService.toggleLabel(blockId, labelId);
    setBlocks(prev => prev.map(b => b.id === blockId ? { ...b, label_ids: newLabelIds } : b));
  }, []);

  const createLabel = useCallback(async (name: string, color: string): Promise<JournalLabel | null> => {
    try {
      const label = await journalService.createLabel({ feature_instance_id: featureInstanceId, name, color });
      setLabels(prev => [...prev, label]);
      return label;
    } catch {
      return null;
    }
  }, [featureInstanceId]);

  const updateLabel = useCallback(async (labelId: string, name: string, color: string) => {
    await journalService.updateLabel(labelId, { name, color });
    setLabels(prev => prev.map(l => l.id === labelId ? { ...l, name, color } : l));
  }, []);

  const deleteLabel = useCallback(async (labelId: string) => {
    await journalService.deleteLabel(labelId);
    setLabels(prev => prev.filter(l => l.id !== labelId));
  }, []);

  return { blocks, labels, days, loading, error, createBlock, updateBlock, deleteBlock, reorderBlocks, toggleLabel, createLabel, updateLabel, deleteLabel };
}
