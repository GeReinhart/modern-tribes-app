import { useCallback, useEffect, useRef, useState } from 'react';

import { kanbanService } from './service.ts';
import {
  CardCreate,
  CardUpdate,
  ColumnCreate,
  KanbanBoard,
  KanbanCard,
  KanbanColumn,
  KanbanLabel,
  LabelCreate,
  LabelUpdate,
  MoveDirection,
  PersonOption,
  ReorderDirection,
  TaskReminderCreate,
} from './types.ts';

const POLL_INTERVAL_MS = 10_000;
const EMPTY_BOARD: KanbanBoard = { columns: [], cards: [], labels: [] };

export function useKanban(featureInstanceId: string | null) {
  const [board, setBoard] = useState<KanbanBoard>(EMPTY_BOARD);
  const [persons, setPersons] = useState<PersonOption[]>([]);
  const [error, setError] = useState<string | null>(null);
  const [loaded, setLoaded] = useState(false);
  const intervalRef = useRef<ReturnType<typeof setInterval> | null>(null);

  const fetchBoard = useCallback(async () => {
    if (!featureInstanceId) return;
    try {
      setBoard(await kanbanService.getBoard(featureInstanceId));
      setLoaded(true);
    } catch (e: unknown) {
      setError(e instanceof Error ? e.message : 'An error occurred');
    }
  }, [featureInstanceId]);

  useEffect(() => {
    if (!featureInstanceId) return;
    fetchBoard();
    kanbanService
      .getPersons(featureInstanceId)
      .then(setPersons)
      .catch(() => {});
    intervalRef.current = setInterval(fetchBoard, POLL_INTERVAL_MS);
    return () => {
      if (intervalRef.current) clearInterval(intervalRef.current);
    };
  }, [featureInstanceId, fetchBoard]);

  const patchCards = useCallback((updated: KanbanCard[]) => {
    const map = new Map(updated.map((c) => [c.id, c]));
    setBoard((prev) => ({
      ...prev,
      cards: prev.cards.map((c) => map.get(c.id) ?? c),
    }));
  }, []);

  const createColumn = useCallback(
    async (data: ColumnCreate): Promise<KanbanColumn | null> => {
      try {
        const col = await kanbanService.createColumn(data);
        setBoard((prev) => ({
          ...prev,
          columns: [...prev.columns, col].sort(
            (a, b) => a.position - b.position,
          ),
        }));
        return col;
      } catch (e: unknown) {
        setError(e instanceof Error ? e.message : 'An error occurred');
        return null;
      }
    },
    [],
  );

  const renameColumn = useCallback(async (columnId: string, name: string) => {
    try {
      const updated = await kanbanService.renameColumn(columnId, name);
      setBoard((prev) => ({
        ...prev,
        columns: prev.columns.map((c) =>
          c.id === columnId ? { ...c, name: updated.name } : c,
        ),
      }));
    } catch (e: unknown) {
      setError(e instanceof Error ? e.message : 'An error occurred');
    }
  }, []);

  const moveColumn = useCallback(
    async (columnId: string, direction: MoveDirection) => {
      try {
        const updated = await kanbanService.moveColumn(columnId, direction);
        if (!updated.length) return;
        const map = new Map(updated.map((c) => [c.id, c]));
        setBoard((prev) => ({
          ...prev,
          columns: prev.columns
            .map((c) => map.get(c.id) ?? c)
            .sort((a, b) => a.position - b.position),
        }));
      } catch (e: unknown) {
        setError(e instanceof Error ? e.message : 'An error occurred');
      }
    },
    [],
  );

  const deleteColumn = useCallback(async (columnId: string) => {
    try {
      await kanbanService.deleteColumn(columnId);
      setBoard((prev) => ({
        ...prev,
        columns: prev.columns.filter((c) => c.id !== columnId),
      }));
    } catch (e: unknown) {
      setError(e instanceof Error ? e.message : 'An error occurred');
    }
  }, []);

  const createCard = useCallback(
    async (data: CardCreate): Promise<KanbanCard | null> => {
      try {
        const card = await kanbanService.createCard(data);
        setBoard((prev) => ({ ...prev, cards: [...prev.cards, card] }));
        return card;
      } catch (e: unknown) {
        setError(e instanceof Error ? e.message : 'An error occurred');
        return null;
      }
    },
    [],
  );

  const updateCard = useCallback(async (cardId: string, data: CardUpdate) => {
    try {
      const updated = await kanbanService.updateCard(cardId, data);
      setBoard((prev) => ({
        ...prev,
        cards: prev.cards.map((c) => (c.id === cardId ? updated : c)),
      }));
    } catch (e: unknown) {
      setError(e instanceof Error ? e.message : 'An error occurred');
    }
  }, []);

  const archiveCard = useCallback(async (cardId: string) => {
    try {
      await kanbanService.archiveCard(cardId);
      setBoard((prev) => ({
        ...prev,
        cards: prev.cards.map((c) =>
          c.id === cardId ? { ...c, status: 'archived' as const } : c,
        ),
      }));
    } catch (e: unknown) {
      setError(e instanceof Error ? e.message : 'An error occurred');
    }
  }, []);

  const restoreCard = useCallback(async (cardId: string) => {
    try {
      const updated = await kanbanService.restoreCard(cardId);
      setBoard((prev) => ({
        ...prev,
        cards: prev.cards.map((c) => (c.id === cardId ? updated : c)),
      }));
    } catch (e: unknown) {
      setError(e instanceof Error ? e.message : 'An error occurred');
    }
  }, []);

  const moveCard = useCallback(
    async (cardId: string, direction: MoveDirection) => {
      try {
        patchCards(await kanbanService.moveCard(cardId, direction));
      } catch (e: unknown) {
        setError(e instanceof Error ? e.message : 'An error occurred');
      }
    },
    [patchCards],
  );

  const reorderCard = useCallback(
    async (cardId: string, direction: ReorderDirection) => {
      let previousCards: KanbanCard[] = [];
      setBoard((prev) => {
        previousCards = prev.cards;
        const card = prev.cards.find((c) => c.id === cardId);
        if (!card) return prev;
        const colActive = prev.cards
          .filter(
            (c) => c.column_id === card.column_id && c.status === 'active',
          )
          .sort((a, b) => a.position - b.position);
        const idx = colActive.findIndex((c) => c.id === cardId);
        if (direction === 'top') {
          if (idx === 0) return prev;
          const newPos = colActive[0].position - 1;
          return {
            ...prev,
            cards: prev.cards.map((c) =>
              c.id === cardId ? { ...c, position: newPos } : c,
            ),
          };
        }
        if (direction === 'bottom') {
          if (idx === colActive.length - 1) return prev;
          const newPos = colActive[colActive.length - 1].position + 1;
          return {
            ...prev,
            cards: prev.cards.map((c) =>
              c.id === cardId ? { ...c, position: newPos } : c,
            ),
          };
        }
        const targetIdx = direction === 'up' ? idx - 1 : idx + 1;
        if (targetIdx < 0 || targetIdx >= colActive.length) return prev;
        const posA = colActive[idx].position;
        const posB = colActive[targetIdx].position;
        return {
          ...prev,
          cards: prev.cards.map((c) => {
            if (c.id === colActive[idx].id) return { ...c, position: posB };
            if (c.id === colActive[targetIdx].id)
              return { ...c, position: posA };
            return c;
          }),
        };
      });
      try {
        patchCards(await kanbanService.reorderCard(cardId, direction));
      } catch (e: unknown) {
        setBoard((prev) => ({ ...prev, cards: previousCards }));
        setError(e instanceof Error ? e.message : 'An error occurred');
      }
    },
    [patchCards],
  );

  const createLabel = useCallback(
    async (data: LabelCreate): Promise<KanbanLabel | null> => {
      try {
        const label = await kanbanService.createLabel(data);
        setBoard((prev) => ({ ...prev, labels: [...prev.labels, label] }));
        return label;
      } catch (e: unknown) {
        setError(e instanceof Error ? e.message : 'An error occurred');
        return null;
      }
    },
    [],
  );

  const updateLabel = useCallback(
    async (labelId: string, data: LabelUpdate) => {
      try {
        const updated = await kanbanService.updateLabel(labelId, data);
        setBoard((prev) => ({
          ...prev,
          labels: prev.labels.map((l) => (l.id === labelId ? updated : l)),
        }));
      } catch (e: unknown) {
        setError(e instanceof Error ? e.message : 'An error occurred');
      }
    },
    [],
  );

  const deleteLabel = useCallback(async (labelId: string) => {
    try {
      await kanbanService.deleteLabel(labelId);
      setBoard((prev) => ({
        ...prev,
        labels: prev.labels.filter((l) => l.id !== labelId),
        cards: prev.cards.map((c) => ({
          ...c,
          label_ids: c.label_ids.filter((id) => id !== labelId),
        })),
      }));
    } catch (e: unknown) {
      setError(e instanceof Error ? e.message : 'An error occurred');
    }
  }, []);

  const toggleCardLabel = useCallback(
    async (cardId: string, labelId: string, currentLabelIds: string[]) => {
      try {
        const has = currentLabelIds.includes(labelId);
        const updated = has
          ? await kanbanService.removeCardLabel(cardId, labelId)
          : await kanbanService.addCardLabel(cardId, labelId);
        setBoard((prev) => ({
          ...prev,
          cards: prev.cards.map((c) => (c.id === cardId ? updated : c)),
        }));
      } catch (e: unknown) {
        setError(e instanceof Error ? e.message : 'An error occurred');
      }
    },
    [],
  );

  const setCardReminders = useCallback(
    async (cardId: string, reminders: TaskReminderCreate[]): Promise<void> => {
      try {
        const updated = await kanbanService.setReminders(cardId, reminders);
        setBoard((prev) => ({
          ...prev,
          cards: prev.cards.map((c) =>
            c.id === cardId ? { ...c, reminders: updated } : c,
          ),
        }));
      } catch (e: unknown) {
        setError(e instanceof Error ? e.message : 'An error occurred');
      }
    },
    [],
  );

  return {
    board,
    persons,
    error,
    loaded,
    createColumn,
    renameColumn,
    deleteColumn,
    moveColumn,
    createCard,
    updateCard,
    archiveCard,
    restoreCard,
    moveCard,
    reorderCard,
    createLabel,
    updateLabel,
    deleteLabel,
    toggleCardLabel,
    setCardReminders,
    refetch: fetchBoard,
  };
}
