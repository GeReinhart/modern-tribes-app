import React, { useState } from 'react';
import { useTranslation } from 'react-i18next';
import { useTheme } from '@/contexts/ThemeContext';
import { ThemedConfirmDialog } from '@/components/common/layout/ThemedConfirmDialog';
import { KanbanCard as Card, CardUpdate } from './types';
import KanbanCardBody from './KanbanCardBody';

interface Props {
    card: Card;
    canEdit: boolean;
    isFirstCol: boolean;
    isLastCol: boolean;
    accentColor: string;
    onUpdate: (cardId: string, data: CardUpdate) => Promise<void>;
    onArchive: (cardId: string) => Promise<void>;
    onMove: (cardId: string, direction: 'prev' | 'next') => Promise<void>;
}

const KanbanCard: React.FC<Props> = ({ card, canEdit, isFirstCol, isLastCol, accentColor, onUpdate, onArchive, onMove }) => {
    const { t } = useTranslation();
    const { theme } = useTheme();
    const [expanded, setExpanded] = useState(false);
    const [editing, setEditing] = useState(false);
    const [editTitle, setEditTitle] = useState(card.title);
    const [confirmArchive, setConfirmArchive] = useState(false);

    const handleCommit = () => {
        const trimmed = editTitle.trim();
        if (trimmed && trimmed !== card.title) onUpdate(card.id, { title: trimmed });
        setEditing(false);
    };

    const handleKeyDown = (e: React.KeyboardEvent<HTMLInputElement>) => {
        if (e.key === 'Enter') { e.preventDefault(); handleCommit(); }
        if (e.key === 'Escape') { setEditing(false); setEditTitle(card.title); }
    };

    return (
        <div style={{
            borderRadius: '8px',
            border: `1px solid ${theme.colors.border}`,
            borderLeft: `3px solid ${accentColor}`,
            marginBottom: '8px',
            backgroundColor: theme.colors.surface,
            overflow: 'hidden',
            boxShadow: '0 1px 3px rgba(0,0,0,0.06)',
        }}>
            <div style={{ display: 'flex', alignItems: 'center', gap: '6px', padding: '9px 10px 9px 10px' }}>
                {canEdit && (
                    <>
                        <button disabled={isFirstCol} onClick={() => onMove(card.id, 'prev')} style={{ background: 'none', border: 'none', cursor: isFirstCol ? 'default' : 'pointer', opacity: isFirstCol ? 0.2 : 1, fontSize: '15px', padding: '0 2px', color: theme.colors.primary, flexShrink: 0 }}>←</button>
                        <button disabled={isLastCol} onClick={() => onMove(card.id, 'next')} style={{ background: 'none', border: 'none', cursor: isLastCol ? 'default' : 'pointer', opacity: isLastCol ? 0.2 : 1, fontSize: '15px', padding: '0 2px', color: theme.colors.primary, flexShrink: 0 }}>→</button>
                    </>
                )}

                {canEdit && editing ? (
                    <input
                        autoFocus value={editTitle}
                        onChange={e => setEditTitle(e.target.value)}
                        onBlur={handleCommit} onKeyDown={handleKeyDown}
                        style={{ flex: 1, fontSize: 'var(--font-sm)', padding: '2px 6px', border: `1px solid ${theme.colors.primary}`, borderRadius: '4px', backgroundColor: theme.colors.surface, color: theme.colors.text, outline: 'none' }}
                    />
                ) : (
                    <span
                        onClick={() => canEdit ? setEditing(true) : setExpanded(v => !v)}
                        style={{ flex: 1, fontSize: 'var(--font-sm)', color: theme.colors.text, cursor: canEdit ? 'text' : 'pointer' }}
                    >
                        {card.title}
                    </span>
                )}

                <div style={{ display: 'flex', alignItems: 'center', gap: '4px', flexShrink: 0 }}>
                    {card.assigned_person_name && (
                        <span style={{ fontSize: '11px', padding: '2px 7px', borderRadius: '10px', background: accentColor + '22', color: accentColor, fontWeight: 600, border: `1px solid ${accentColor}44` }}>
                            {card.assigned_person_name}
                        </span>
                    )}
                    {card.document_id && (
                        <span style={{ fontSize: '12px', color: theme.colors.secondary }} title="Has notes">📝</span>
                    )}
                    <button onClick={() => setExpanded(v => !v)} style={{ background: 'none', border: 'none', cursor: 'pointer', color: theme.colors.secondary, fontSize: '11px', padding: '2px 4px' }}>
                        {expanded ? '▲' : '▼'}
                    </button>
                    {canEdit && (
                        <button onClick={() => setConfirmArchive(true)} title={t('common.archive')} style={{ background: 'none', border: 'none', cursor: 'pointer', color: theme.colors.danger, fontSize: '12px', padding: '2px 4px' }}>✕</button>
                    )}
                </div>
            </div>

            {expanded && <KanbanCardBody card={card} canEdit={canEdit} onUpdate={onUpdate} />}

            <ThemedConfirmDialog
                isOpen={confirmArchive}
                onClose={() => setConfirmArchive(false)}
                onConfirm={() => { setConfirmArchive(false); onArchive(card.id); }}
                title={t('features.kanban.archiveCardTitle')}
                message={t('features.kanban.archiveCardMessage', { title: card.title })}
                confirmText={t('common.archive')}
            />
        </div>
    );
};

export default KanbanCard;
