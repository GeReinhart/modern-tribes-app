import React, { useState } from 'react';
import { useTranslation } from 'react-i18next';
import { useTheme } from '@/contexts/ThemeContext';
import { ThemedButton } from '@/components/common/form/ThemedButton';
import { ThemedSvgIcon } from '@/components/common/icons/ThemedSvgIcon';
import { KanbanCard as Card, KanbanLabel, PersonOption, CardUpdate, LabelCreate, ReorderDirection, fibColor } from './types';
import KanbanCardModal from './KanbanCardModal';
import KanbanCardBody from './KanbanCardBody';

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
    onReorder: (cardId: string, direction: ReorderDirection) => Promise<void>;
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
    const [confirmArchive, setConfirmArchive] = useState(false);
    const [expanded, setExpanded] = useState(false);

    const isArchived = card.status === 'archived';
    const borderColor = card.size ? fibColor(card.size) : accentColor;
    const cardLabels = boardLabels.filter(l => card.label_ids.includes(l.id));
    const getInitials = (name: string) =>
        name.split(' ').slice(0, 2).map(w => w[0]?.toUpperCase() ?? '').join('');

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
                    {/* Line 1: title + expand toggle */}
                    <div style={{ display: 'flex', alignItems: 'flex-start', gap: '4px' }}>
                        <span
                            onClick={() => setModalOpen(true)}
                            style={{
                                flex: 1,
                                fontSize: 'var(--font-sm)',
                                color: isArchived ? theme.colors.secondary : theme.colors.text,
                                cursor: 'pointer',
                                textDecoration: isArchived ? 'line-through' : 'none',
                                lineHeight: 1.4,
                            }}
                        >
                            {card.title}
                        </span>
                        <button
                            onClick={() => setExpanded(v => !v)}
                            title={expanded ? t('features.kanban.hideContent') : t('features.kanban.showContent')}
                            style={{ background: 'none', border: 'none', cursor: 'pointer', padding: '1px 2px', display: 'flex', alignItems: 'center', opacity: 0.75, flexShrink: 0 }}
                        >
                            <ThemedSvgIcon name={expanded ? 'chevron-up' : 'chevron-down'} color={theme.colors.text} size={13} />
                        </button>
                    </div>

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

                        {/* Within-column reorder: top / up / down / bottom */}
                        {canEdit && !isArchived && (
                            <>
                                <button disabled={isFirstInCol} onClick={() => onReorder(card.id, 'top')} title={t('features.kanban.moveToTop')} style={{ background: 'none', border: 'none', cursor: isFirstInCol ? 'default' : 'pointer', opacity: isFirstInCol ? 0.2 : 1, padding: '0 1px', flexShrink: 0, display: 'flex', alignItems: 'center' }}>
                                    <ThemedSvgIcon name="chevrons-up" color={theme.colors.text} size={14} />
                                </button>
                                <button disabled={isFirstInCol} onClick={() => onReorder(card.id, 'up')} style={{ background: 'none', border: 'none', cursor: isFirstInCol ? 'default' : 'pointer', opacity: isFirstInCol ? 0.2 : 1, padding: '0 1px', flexShrink: 0, display: 'flex', alignItems: 'center' }}>
                                    <ThemedSvgIcon name="arrow-up" color={theme.colors.text} size={14} />
                                </button>
                                <button disabled={isLastInCol} onClick={() => onReorder(card.id, 'down')} style={{ background: 'none', border: 'none', cursor: isLastInCol ? 'default' : 'pointer', opacity: isLastInCol ? 0.2 : 1, padding: '0 1px', flexShrink: 0, display: 'flex', alignItems: 'center' }}>
                                    <ThemedSvgIcon name="arrow-down" color={theme.colors.text} size={14} />
                                </button>
                                <button disabled={isLastInCol} onClick={() => onReorder(card.id, 'bottom')} title={t('features.kanban.moveToBottom')} style={{ background: 'none', border: 'none', cursor: isLastInCol ? 'default' : 'pointer', opacity: isLastInCol ? 0.2 : 1, padding: '0 1px', flexShrink: 0, display: 'flex', alignItems: 'center' }}>
                                    <ThemedSvgIcon name="chevrons-down" color={theme.colors.text} size={14} />
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
                            <span style={{ fontSize: '10px', fontWeight: 700, padding: '1px 5px', borderRadius: '8px', background: fibColor(card.size), color: theme.colors.surface, flexShrink: 0 }} title={t('features.kanban.size')}>
                                {card.size}
                            </span>
                        )}

                        {card.assigned_person_name && persons.length > 1 && (
                            <span style={{ fontSize: '11px', padding: '2px 6px', borderRadius: '10px', background: accentColor + '22', color: accentColor, fontWeight: 600, border: `1px solid ${accentColor}44`, whiteSpace: 'nowrap' }}>
                                {expanded ? card.assigned_person_name : getInitials(card.assigned_person_name)}
                            </span>
                        )}

                        {/* Edit + Archive buttons */}
                        {!isArchived && (
                            <>
                                <button onClick={() => setModalOpen(true)} title={t('common.edit')} style={{ background: 'none', border: 'none', cursor: 'pointer', padding: '1px 3px', display: 'flex', alignItems: 'center', opacity: 0.8 }}>
                                    <ThemedSvgIcon name="pencil" color={theme.colors.text} size={13} />
                                </button>
                                {canEdit && (
                                    <button onClick={() => setConfirmArchive(true)} title={t('common.archive')} style={{ background: 'none', border: 'none', cursor: 'pointer', padding: '1px 3px', display: 'flex', alignItems: 'center', opacity: 0.8 }}>
                                        <ThemedSvgIcon name="archive" color={theme.colors.danger} size={13} />
                                    </button>
                                )}
                            </>
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

                {expanded && (
                    <KanbanCardBody
                        card={card}
                        canEdit={canEdit && !isArchived}
                        boardLabels={boardLabels}
                        onUpdate={onUpdate}
                        onToggleLabel={onToggleLabel}
                    />
                )}
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
                />
            )}

            {confirmArchive && (
                <div
                    style={{ position: 'fixed', inset: 0, backgroundColor: 'rgba(0,0,0,0.55)', display: 'flex', alignItems: 'center', justifyContent: 'center', zIndex: 300, padding: '16px' }}
                    onClick={e => { if (e.target === e.currentTarget) setConfirmArchive(false); }}
                >
                    <div style={{ backgroundColor: theme.colors.surface, borderRadius: '12px', border: `1px solid ${theme.colors.border}`, padding: '24px', maxWidth: '360px', width: '100%', boxShadow: '0 20px 60px rgba(0,0,0,0.25)', display: 'flex', flexDirection: 'column', gap: '16px' }}>
                        <div style={{ display: 'flex', alignItems: 'center', gap: '10px' }}>
                            <ThemedSvgIcon name="archive" color={theme.colors.danger} size={20} />
                            <span style={{ fontWeight: 700, fontSize: 'var(--font-md)', color: theme.colors.text }}>{t('features.kanban.archiveCardTitle')}</span>
                        </div>
                        <p style={{ margin: 0, fontSize: 'var(--font-sm)', color: theme.colors.secondary }}>
                            {t('features.kanban.archiveCardMessage', { title: card.title })}
                        </p>
                        <div style={{ display: 'flex', justifyContent: 'flex-end', gap: '8px' }}>
                            <ThemedButton variant="ghost" onClick={() => setConfirmArchive(false)}>{t('common.cancel')}</ThemedButton>
                            <ThemedButton variant="danger" onClick={() => { onArchive(card.id); setConfirmArchive(false); }}>{t('common.archive')}</ThemedButton>
                        </div>
                    </div>
                </div>
            )}
        </>
    );
};

export default KanbanCard;
