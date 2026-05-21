import React, { useState } from 'react';
import { useTranslation } from 'react-i18next';
import { useTheme } from '@/contexts/ThemeContext';
import { ThemedSvgIcon } from '@/components/common/icons/ThemedSvgIcon';
import { KanbanCard as Card, KanbanLabel, PersonOption, CardUpdate, LabelCreate, fibColor } from './types';
import KanbanCardModal from './KanbanCardModal';

interface Props {
    card: Card;
    canEdit: boolean;
    isFirstCol: boolean;
    isLastCol: boolean;
    isFirstInCol: boolean;
    isLastInCol: boolean;
    accentColor: string;
    boardLabels: KanbanLabel[];
    persons: PersonOption[];
    onUpdate: (cardId: string, data: CardUpdate) => Promise<void>;
    onArchive: (cardId: string) => Promise<void>;
    onRestore: (cardId: string) => Promise<void>;
    onMove: (cardId: string, direction: 'prev' | 'next') => Promise<void>;
    onReorder: (cardId: string, direction: 'up' | 'down') => Promise<void>;
    onToggleLabel: (cardId: string, labelId: string, currentLabelIds: string[]) => Promise<void>;
    onCreateLabel: (data: LabelCreate) => Promise<KanbanLabel | null>;
}

const KanbanCard: React.FC<Props> = ({
    card, canEdit, isFirstCol, isLastCol, isFirstInCol, isLastInCol,
    accentColor, boardLabels, persons,
    onUpdate, onArchive, onRestore, onMove, onReorder, onToggleLabel, onCreateLabel,
}) => {
    const { t } = useTranslation();
    const { theme } = useTheme();
    const [modalOpen, setModalOpen] = useState(false);

    const isArchived = card.status === 'archived';
    const borderColor = card.size ? fibColor(card.size) : accentColor;
    const cardLabels = boardLabels.filter(l => card.label_ids.includes(l.id));

    return (
        <>
            <div style={{
                borderRadius: '8px',
                border: `1px solid ${theme.colors.border}`,
                borderLeft: `3px solid ${borderColor}`,
                marginBottom: '8px',
                backgroundColor: isArchived ? `${theme.colors.surface}88` : theme.colors.surface,
                boxShadow: '0 1px 3px rgba(0,0,0,0.06)',
                opacity: isArchived ? 0.65 : 1,
            }}>
                <div style={{ padding: '8px 10px', display: 'flex', flexDirection: 'column', gap: '6px' }}>
                    {/* Line 1: title */}
                    <span
                        onClick={() => setModalOpen(true)}
                        style={{
                            fontSize: 'var(--font-sm)',
                            color: isArchived ? theme.colors.secondary : theme.colors.text,
                            cursor: 'pointer',
                            textDecoration: isArchived ? 'line-through' : 'none',
                            lineHeight: 1.4,
                        }}
                    >
                        {card.title}
                    </span>

                    {/* Line 2: arrows (left) + badges (right) */}
                    <div style={{ display: 'flex', alignItems: 'center', gap: '3px' }}>
                        {/* Column move: left / right */}
                        {canEdit && !isArchived && (
                            <>
                                <button disabled={isFirstCol} onClick={() => onMove(card.id, 'prev')} style={{ background: 'none', border: 'none', cursor: isFirstCol ? 'default' : 'pointer', opacity: isFirstCol ? 0.2 : 1, padding: '0 1px', flexShrink: 0, display: 'flex', alignItems: 'center' }}>
                                    <ThemedSvgIcon name="arrow-left" color={theme.colors.primary} size={14} />
                                </button>
                                <button disabled={isLastCol} onClick={() => onMove(card.id, 'next')} style={{ background: 'none', border: 'none', cursor: isLastCol ? 'default' : 'pointer', opacity: isLastCol ? 0.2 : 1, padding: '0 1px', flexShrink: 0, display: 'flex', alignItems: 'center' }}>
                                    <ThemedSvgIcon name="arrow-right" color={theme.colors.primary} size={14} />
                                </button>
                            </>
                        )}

                        {/* Within-column reorder: up / down */}
                        {canEdit && !isArchived && (
                            <>
                                <button disabled={isFirstInCol} onClick={() => onReorder(card.id, 'up')} style={{ background: 'none', border: 'none', cursor: isFirstInCol ? 'default' : 'pointer', opacity: isFirstInCol ? 0.2 : 1, padding: '0 1px', flexShrink: 0, display: 'flex', alignItems: 'center' }}>
                                    <ThemedSvgIcon name="arrow-up" color={theme.colors.secondary} size={14} />
                                </button>
                                <button disabled={isLastInCol} onClick={() => onReorder(card.id, 'down')} style={{ background: 'none', border: 'none', cursor: isLastInCol ? 'default' : 'pointer', opacity: isLastInCol ? 0.2 : 1, padding: '0 1px', flexShrink: 0, display: 'flex', alignItems: 'center' }}>
                                    <ThemedSvgIcon name="arrow-down" color={theme.colors.secondary} size={14} />
                                </button>
                            </>
                        )}

                        {/* Spacer */}
                        <div style={{ flex: 1 }} />

                        {/* Badges */}
                        {cardLabels.map(l => (
                            <span key={l.id} title={l.name} style={{ width: '10px', height: '10px', borderRadius: '50%', background: l.color, display: 'inline-block', flexShrink: 0 }} />
                        ))}

                        {card.size && (
                            <span style={{ fontSize: '10px', fontWeight: 700, padding: '1px 5px', borderRadius: '8px', background: fibColor(card.size), color: '#fff', flexShrink: 0 }} title={t('features.kanban.size')}>
                                {card.size}
                            </span>
                        )}

                        {card.assigned_person_name && (
                            <span style={{ fontSize: '11px', padding: '2px 6px', borderRadius: '10px', background: accentColor + '22', color: accentColor, fontWeight: 600, border: `1px solid ${accentColor}44`, whiteSpace: 'nowrap' }}>
                                {card.assigned_person_name}
                            </span>
                        )}

                        {card.document_id && (
                            <span style={{ color: theme.colors.secondary, display: 'flex', alignItems: 'center' }} title={t('features.kanban.notes')}>
                                <ThemedSvgIcon name="file-text" color={theme.colors.secondary} size={13} />
                            </span>
                        )}

                        {/* Edit button */}
                        {!isArchived && (
                            <button onClick={() => setModalOpen(true)} title={t('common.edit')} style={{ background: 'none', border: 'none', cursor: 'pointer', color: theme.colors.secondary, padding: '1px 3px', display: 'flex', alignItems: 'center', opacity: 0.6 }}>
                                <ThemedSvgIcon name="pencil" color={theme.colors.secondary} size={13} />
                            </button>
                        )}

                        {/* Archive indicator + restore button (archived) */}
                        {isArchived && (
                            <span style={{ color: theme.colors.secondary, display: 'flex', alignItems: 'center', opacity: 0.7 }} title={t('features.kanban.archived')}>
                                <ThemedSvgIcon name="archive" color={theme.colors.secondary} size={13} />
                            </span>
                        )}
                        {isArchived && canEdit && (
                            <button onClick={() => onRestore(card.id)} title={t('features.kanban.restore')} style={{ background: 'none', border: `1px solid ${theme.colors.success}`, borderRadius: '4px', cursor: 'pointer', padding: '2px 4px', display: 'flex', alignItems: 'center' }}>
                                <ThemedSvgIcon name="refresh" color={theme.colors.success} size={13} />
                            </button>
                        )}
                    </div>
                </div>
            </div>

            {modalOpen && (
                <KanbanCardModal
                    card={card}
                    boardLabels={boardLabels}
                    persons={persons}
                    canEdit={canEdit && !isArchived}
                    onClose={() => setModalOpen(false)}
                    onUpdate={onUpdate}
                    onToggleLabel={onToggleLabel}
                    onCreateLabel={onCreateLabel}
                    onArchive={onArchive}
                />
            )}
        </>
    );
};

export default KanbanCard;
