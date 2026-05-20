import { useState, useEffect, useCallback, useRef } from 'react';
import { kanbanService } from './service';
import { KanbanBoard, KanbanCard, KanbanColumn, PersonOption, CardCreate, CardUpdate, ColumnCreate, MoveDirection } from './types';

const POLL_INTERVAL_MS = 10_000;
const EMPTY_BOARD: KanbanBoard = { columns: [], cards: [] };

export function useKanban(featureInstanceId: string | null) {
    const [board, setBoard] = useState<KanbanBoard>(EMPTY_BOARD);
    const [persons, setPersons] = useState<PersonOption[]>([]);
    const [error, setError] = useState<string | null>(null);
    const intervalRef = useRef<ReturnType<typeof setInterval> | null>(null);

    const fetchBoard = useCallback(async () => {
        if (!featureInstanceId) return;
        try {
            setBoard(await kanbanService.getBoard(featureInstanceId));
        } catch (e: any) {
            setError(e.message);
        }
    }, [featureInstanceId]);

    useEffect(() => {
        if (!featureInstanceId) return;
        fetchBoard();
        kanbanService.getPersons(featureInstanceId).then(setPersons).catch(() => {});
        intervalRef.current = setInterval(fetchBoard, POLL_INTERVAL_MS);
        return () => { if (intervalRef.current) clearInterval(intervalRef.current); };
    }, [featureInstanceId, fetchBoard]);

    const patchCards = useCallback((updated: KanbanCard[]) => {
        const map = new Map(updated.map(c => [c.id, c]));
        setBoard(prev => ({ ...prev, cards: prev.cards.map(c => map.get(c.id) ?? c) }));
    }, []);

    const createColumn = useCallback(async (data: ColumnCreate): Promise<KanbanColumn | null> => {
        try {
            const col = await kanbanService.createColumn(data);
            setBoard(prev => ({
                ...prev,
                columns: [...prev.columns, col].sort((a, b) => a.position - b.position),
            }));
            return col;
        } catch (e: any) { setError(e.message); return null; }
    }, []);

    const renameColumn = useCallback(async (columnId: string, name: string) => {
        try {
            const updated = await kanbanService.renameColumn(columnId, name);
            setBoard(prev => ({ ...prev, columns: prev.columns.map(c => c.id === columnId ? { ...c, name: updated.name } : c) }));
        } catch (e: any) { setError(e.message); }
    }, []);

    const moveColumn = useCallback(async (columnId: string, direction: MoveDirection) => {
        try {
            const updated = await kanbanService.moveColumn(columnId, direction);
            if (!updated.length) return;
            const map = new Map(updated.map(c => [c.id, c]));
            setBoard(prev => ({ ...prev, columns: prev.columns.map(c => map.get(c.id) ?? c).sort((a, b) => a.position - b.position) }));
        } catch (e: any) { setError(e.message); }
    }, []);

    const deleteColumn = useCallback(async (columnId: string) => {
        try {
            await kanbanService.deleteColumn(columnId);
            setBoard(prev => ({ ...prev, columns: prev.columns.filter(c => c.id !== columnId) }));
        } catch (e: any) { setError(e.message); }
    }, []);

    const createCard = useCallback(async (data: CardCreate): Promise<KanbanCard | null> => {
        try {
            const card = await kanbanService.createCard(data);
            setBoard(prev => ({ ...prev, cards: [...prev.cards, card] }));
            return card;
        } catch (e: any) { setError(e.message); return null; }
    }, []);

    const updateCard = useCallback(async (cardId: string, data: CardUpdate) => {
        try {
            const updated = await kanbanService.updateCard(cardId, data);
            setBoard(prev => ({ ...prev, cards: prev.cards.map(c => c.id === cardId ? updated : c) }));
        } catch (e: any) { setError(e.message); }
    }, []);

    const archiveCard = useCallback(async (cardId: string) => {
        try {
            await kanbanService.archiveCard(cardId);
            setBoard(prev => ({ ...prev, cards: prev.cards.filter(c => c.id !== cardId) }));
        } catch (e: any) { setError(e.message); }
    }, []);

    const moveCard = useCallback(async (cardId: string, direction: 'prev' | 'next') => {
        try {
            patchCards(await kanbanService.moveCard(cardId, direction));
        } catch (e: any) { setError(e.message); }
    }, [patchCards]);

    return {
        board, persons, error,
        createColumn, renameColumn, deleteColumn, moveColumn,
        createCard, updateCard, archiveCard, moveCard,
        refetch: fetchBoard,
    };
}
