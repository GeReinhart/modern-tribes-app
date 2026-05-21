import React, { useState } from 'react';
import { useTranslation } from 'react-i18next';
import { useTheme } from '@/contexts/ThemeContext';
import { ThemedConfirmDialog } from '@/components/common/layout/ThemedConfirmDialog';
import { ThemedSvgIcon } from '@/components/common/icons/ThemedSvgIcon';
import { KanbanColumn as Column, KanbanCard, KanbanBoard, KanbanLabel, PersonOption, CardCreate, CardUpdate, LabelCreate, MoveDirection, ReorderDirection } from './types';
import KanbanCardComponent from './KanbanCard';

interface Props {
    column: Column;
    board: KanbanBoard;
    featureInstanceId: string;
    canEdit: boolean;
    configuring: boolean;
    isFirst: boolean;
    isLast: boolean;
    canDelete: boolean;
    showArchived: boolean;
    filterLabelId: string | null;
    persons: PersonOption[];
    onRename: (columnId: string, name: string) => Promise<void>;
    onMove: (columnId: string, direction: MoveDirection) => Promise<void>;
    onDelete: (columnId: string) => Promise<void>;
    onCreateCard: (data: CardCreate) => Promise<KanbanCard | null>;
    onUpdateCard: (cardId: string, data: CardUpdate) => Promise<void>;
    onArchiveCard: (cardId: string) => Promise<void>;
    onRestoreCard: (cardId: string) => Promise<void>;
    onMoveCard: (cardId: string, direction: 'prev' | 'next') => Promise<void>;
    onReorderCard: (cardId: string, direction: ReorderDirection) => Promise<void>;
    onToggleLabel: (cardId: string, labelId: string, currentLabelIds: string[]) => Promise<void>;
    onCreateLabel: (data: LabelCreate) => Promise<KanbanLabel | null>;
}

const KanbanColumn: React.FC<Props> = ({
    column, board, featureInstanceId, canEdit, configuring, isFirst, isLast, canDelete,
    showArchived, filterLabelId, persons,
    onRename, onMove, onDelete, onCreateCard, onUpdateCard, onArchiveCard, onRestoreCard,
    onMoveCard, onReorderCard, onToggleLabel, onCreateLabel,
}) => {
    const { t } = useTranslation();
    const { theme } = useTheme();
    const [editingName, setEditingName] = useState(false);
    const [nameVal, setNameVal] = useState(column.name);
    const [newCardTitle, setNewCardTitle] = useState('');
    const [confirmDelete, setConfirmDelete] = useState(false);

    const accentColor = isFirst ? theme.colors.primary : isLast ? theme.colors.success : theme.colors.accent;
    const canRename = canEdit && configuring;

    const allColCards = board.cards.filter(c => c.column_id === column.id);
    const activeCards = allColCards.filter(c => c.status === 'active');
    const archivedCards = allColCards.filter(c => c.status === 'archived');

    const visibleActive = (filterLabelId
        ? activeCards.filter(c => c.label_ids.includes(filterLabelId))
        : activeCards
    ).sort((a, b) => a.position - b.position);

    const handleNameCommit = () => {
        const trimmed = nameVal.trim();
        if (trimmed && trimmed !== column.name) onRename(column.id, trimmed);
        setEditingName(false);
    };

    const handleAddCard = async (e: React.FormEvent) => {
        e.preventDefault();
        const title = newCardTitle.trim();
        if (!title) return;
        const autoAssignee = persons.length === 1 ? persons[0].id : undefined;
        await onCreateCard({ feature_instance_id: featureInstanceId, column_id: column.id, title, position: activeCards.length, assigned_person_id: autoAssignee });
        setNewCardTitle('');
    };

    return (
        <div style={{
            flex: '1 1 0', minWidth: '240px', display: 'flex', flexDirection: 'column',
            backgroundColor: theme.colors.surface, borderRadius: '10px',
            border: `1px solid ${theme.colors.border}`,
            borderTop: `3px solid ${accentColor}`,
            padding: '12px',
        }}>
            <div style={{ display: 'flex', alignItems: 'center', gap: '6px', marginBottom: '12px' }}>
                {canRename && editingName ? (
                    <input
                        autoFocus value={nameVal}
                        onChange={e => setNameVal(e.target.value)}
                        onBlur={handleNameCommit}
                        onKeyDown={e => { if (e.key === 'Enter') handleNameCommit(); if (e.key === 'Escape') { setEditingName(false); setNameVal(column.name); } }}
                        style={{ flex: 1, fontWeight: 700, fontSize: 'var(--font-md)', padding: '2px 6px', border: `1px solid ${theme.colors.primary}`, borderRadius: '4px', backgroundColor: theme.colors.surface, color: theme.colors.text, outline: 'none' }}
                    />
                ) : (
                    <span
                        onClick={() => canRename ? setEditingName(true) : undefined}
                        style={{ flex: 1, fontWeight: 700, fontSize: 'var(--font-md)', color: accentColor, cursor: canRename ? 'pointer' : 'default', letterSpacing: '0.01em' }}
                        title={canRename ? t('features.kanban.clickToRename') : undefined}
                    >
                        {column.name}
                    </span>
                )}
                <span style={{ fontSize: '11px', fontWeight: 600, color: theme.colors.secondary, background: theme.colors.border, borderRadius: '10px', padding: '1px 7px' }}>{visibleActive.length}</span>
                {canEdit && configuring && (
                    <>
                        <button disabled={isFirst} onClick={() => onMove(column.id, 'prev')} style={{ background: 'none', border: 'none', cursor: isFirst ? 'default' : 'pointer', opacity: isFirst ? 0.25 : 1, padding: '2px 3px', display: 'flex', alignItems: 'center' }}><ThemedSvgIcon name="arrow-left" color={theme.colors.primary} size={16} /></button>
                        <button disabled={isLast} onClick={() => onMove(column.id, 'next')} style={{ background: 'none', border: 'none', cursor: isLast ? 'default' : 'pointer', opacity: isLast ? 0.25 : 1, padding: '2px 3px', display: 'flex', alignItems: 'center' }}><ThemedSvgIcon name="arrow-right" color={theme.colors.primary} size={16} /></button>
                    </>
                )}
                {canEdit && configuring && canDelete && (
                    <button onClick={() => setConfirmDelete(true)} title={t('features.kanban.deleteColumn')} style={{ background: 'none', border: 'none', cursor: 'pointer', color: theme.colors.danger, padding: '2px 4px', display: 'flex', alignItems: 'center' }}><ThemedSvgIcon name="x" color={theme.colors.danger} size={15} /></button>
                )}
            </div>

            <div style={{ flex: 1, minHeight: '40px' }}>
                {visibleActive.map((card, idx) => (
                    <KanbanCardComponent
                        key={card.id} card={card} canEdit={canEdit}
                        isFirstCol={isFirst} isLastCol={isLast}
                        isFirstInCol={idx === 0} isLastInCol={idx === visibleActive.length - 1}
                        accentColor={accentColor}
                        boardLabels={board.labels}
                        persons={persons}
                        onUpdate={onUpdateCard} onArchive={onArchiveCard} onRestore={onRestoreCard}
                        onMove={onMoveCard} onReorder={onReorderCard} onToggleLabel={onToggleLabel} onCreateLabel={onCreateLabel}
                    />
                ))}
                {visibleActive.length === 0 && (
                    <div style={{ fontSize: 'var(--font-sm)', color: theme.colors.secondary, textAlign: 'center', padding: '20px 0', fontStyle: 'italic' }}>{t('features.kanban.empty')}</div>
                )}

                {/* Archived cards */}
                {showArchived && archivedCards.length > 0 && (
                    <div style={{ marginTop: '8px', borderTop: `1px dashed ${theme.colors.border}`, paddingTop: '8px' }}>
                        {archivedCards.map(card => (
                            <KanbanCardComponent
                                key={card.id} card={card} canEdit={canEdit}
                                isFirstCol={isFirst} isLastCol={isLast}
                                isFirstInCol={false} isLastInCol={false}
                                accentColor={accentColor}
                                boardLabels={board.labels}
                                persons={persons}
                                onUpdate={onUpdateCard} onArchive={onArchiveCard} onRestore={onRestoreCard}
                                onMove={onMoveCard} onReorder={onReorderCard} onToggleLabel={onToggleLabel} onCreateLabel={onCreateLabel}
                            />
                        ))}
                    </div>
                )}
            </div>

            {canEdit && isFirst && (
                <form onSubmit={handleAddCard} style={{ display: 'flex', gap: '6px', marginTop: '10px' }}>
                    <input
                        value={newCardTitle} onChange={e => setNewCardTitle(e.target.value)}
                        placeholder={t('features.kanban.addCardPlaceholder')}
                        style={{ flex: 1, padding: '6px 9px', border: `1px solid ${theme.colors.border}`, borderRadius: '6px', backgroundColor: theme.colors.surface, color: theme.colors.text, fontSize: 'var(--font-sm)' }}
                    />
                    <button
                        type="submit" disabled={!newCardTitle.trim()}
                        title={t('features.kanban.addCard')}
                        style={{ padding: '6px 10px', border: 'none', borderRadius: '6px', background: newCardTitle.trim() ? theme.colors.primary : theme.colors.border, cursor: newCardTitle.trim() ? 'pointer' : 'default', display: 'flex', alignItems: 'center', transition: 'background 0.15s' }}
                    >
                        <ThemedSvgIcon name="plus" color={newCardTitle.trim() ? '#fff' : theme.colors.secondary} size={18} />
                    </button>
                </form>
            )}

            <ThemedConfirmDialog
                isOpen={confirmDelete}
                onClose={() => setConfirmDelete(false)}
                onConfirm={() => { setConfirmDelete(false); onDelete(column.id); }}
                title={t('features.kanban.deleteColumn')}
                message={t('features.kanban.deleteColumnMessage', { name: column.name })}
                confirmText={t('features.kanban.deleteColumn')}
            />
        </div>
    );
};

export default KanbanColumn;
