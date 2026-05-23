import React, { useState, useEffect, useRef } from 'react';
import { useTranslation } from 'react-i18next';
import { useTheme } from '@/contexts/ThemeContext';
import { ThemedSvgIcon } from '@/components/common/icons/ThemedSvgIcon';
import { User } from 'lucide-react';
import { useKanban } from './hooks';
import KanbanColumnComponent from './KanbanColumn';
import { LabelBar } from '@/components/common/form/LabelBar';
import AddColumnForm from './AddColumnForm';

interface Props {
    featureInstanceId: string;
    canEdit: boolean;
    isManager: boolean;
    actions?: React.ReactNode;
}

const KanbanTab: React.FC<Props> = ({ featureInstanceId, canEdit, isManager, actions }) => {
    const { t } = useTranslation();
    const { theme } = useTheme();
    const {
        board, persons, error, loaded,
        createColumn, renameColumn, deleteColumn, moveColumn,
        createCard, updateCard, archiveCard, restoreCard, moveCard, reorderCard,
        createLabel, updateLabel, deleteLabel, toggleCardLabel,
    } = useKanban(featureInstanceId);

    const [configuring, setConfiguring] = useState(false);
    const [showArchived, setShowArchived] = useState(false);
    const [filterLabelId, setFilterLabelId] = useState<string | null>(null);
    const [filterPersonId, setFilterPersonId] = useState<string | null>(null);


    const initDone = useRef(false);
    const sortedCols = [...board.columns].sort((a, b) => a.position - b.position);
    const maxColumns = 4;

    const activeCardLabelIds = new Set(
        board.cards.filter(c => c.status === 'active').flatMap(c => c.label_ids)
    );
    const assignedPersons = persons.filter(p =>
        board.cards.some(c => c.status === 'active' && c.assigned_person_id === p.id)
    );

    const hasArchived = board.cards.some(c => c.status === 'archived');

    useEffect(() => {
        if (!loaded || initDone.current || !isManager) return;
        initDone.current = true;
        if (board.columns.length === 0) setConfiguring(true);
    }, [loaded, board.columns.length, isManager]);

    useEffect(() => {
        if (!filterLabelId) return;
        const activeIds = new Set(board.cards.filter(c => c.status === 'active').flatMap(c => c.label_ids));
        if (!activeIds.has(filterLabelId)) setFilterLabelId(null);
    }, [board.cards, filterLabelId]);

    const handleDoneConfiguring = () => setConfiguring(false);

    return (
        <div>
            {error && (
                <div style={{ padding: '8px 12px', marginBottom: '12px', color: theme.colors.danger, fontSize: 'var(--font-sm)' }}>
                    {error}
                </div>
            )}

            {/* Top bar: 2-row layout — filters left, actions right */}
            <div style={{ display: 'flex', gap: '8px', marginBottom: '10px' }}>
                {/* Left: label row + person row */}
                <div style={{ flex: 1, display: 'flex', flexDirection: 'column', gap: '8px' }}>
                    <LabelBar
                        labels={board.labels}
                        activeLabelIds={activeCardLabelIds}
                        filterLabelId={filterLabelId}
                        onFilter={setFilterLabelId}
                        isManager={isManager}
                        onUpdate={updateLabel}
                        onDelete={deleteLabel}
                    />
                    {assignedPersons.length > 0 && (
                        <div style={{ display: 'flex', flexWrap: 'wrap', gap: '8px', alignItems: 'center' }}>
                            <User size={14} color={theme.colors.primary} />
                            {assignedPersons.map(person => {
                                const active = filterPersonId === person.id;
                                return (
                                    <button key={person.id} type="button" onClick={() => setFilterPersonId(prev => prev === person.id ? null : person.id)}
                                        style={{ padding: '4px 12px', borderRadius: '16px', fontSize: 'var(--font-xs)', fontWeight: active ? 700 : 500, cursor: 'pointer', border: `1px solid ${theme.colors.primary}`, backgroundColor: active ? theme.colors.primary : 'transparent', color: active ? theme.colors.surface : theme.colors.primary, transition: 'all 0.15s', whiteSpace: 'nowrap' }}>
                                        {person.name}
                                    </button>
                                );
                            })}
                        </div>
                    )}
                </div>

                {/* Right: actions aligned with each filter row */}
                <div style={{ flexShrink: 0, display: 'flex', flexDirection: 'column', gap: '8px', alignItems: 'flex-end' }}>
                    {/* Row 1 (with labels): configure */}
                    {isManager && (
                        <div style={{ display: 'flex', gap: '8px' }}>
                            <button onClick={() => configuring ? handleDoneConfiguring() : setConfiguring(true)} title={configuring ? t('features.kanban.saveColumns') : t('features.kanban.configureColumns')}
                                style={{ background: configuring ? theme.colors.primary : 'none', border: `1px solid ${configuring ? theme.colors.primary : theme.colors.border}`, borderRadius: '6px', cursor: 'pointer', display: 'flex', alignItems: 'center', padding: '6px 10px' }}>
                                <ThemedSvgIcon name="settings" color={configuring ? theme.colors.surface : theme.colors.secondary} size={16} />
                            </button>
                        </div>
                    )}
                    {/* Row 2 (with persons): archive toggle + external actions */}
                    {(assignedPersons.length > 0 || actions || (canEdit && hasArchived)) && (
                        <div style={{ display: 'flex', gap: '8px' }}>
                            {canEdit && hasArchived && (
                                <button onClick={() => setShowArchived(v => !v)} title={showArchived ? t('features.kanban.hideArchived') : t('features.kanban.showArchived')}
                                    style={{ background: showArchived ? theme.colors.secondary : 'none', border: `1px solid ${showArchived ? theme.colors.secondary : theme.colors.border}`, borderRadius: '6px', cursor: 'pointer', display: 'flex', alignItems: 'center', padding: '6px 10px' }}>
                                    <ThemedSvgIcon name={showArchived ? 'eye-off' : 'eye'} color={showArchived ? theme.colors.surface : theme.colors.secondary} size={16} />
                                </button>
                            )}
                            {actions}
                        </div>
                    )}
                </div>
            </div>

            {/* Columns */}
            <div style={{ display: 'flex', gap: '14px', alignItems: 'flex-start', overflowX: 'auto' }}>
                {sortedCols.map((col, idx) => (
                    <KanbanColumnComponent
                        key={col.id}
                        column={col}
                        board={board}
                        featureInstanceId={featureInstanceId}
                        canEdit={canEdit}
                        configuring={isManager && configuring}
                        isFirst={idx === 0}
                        isLast={idx === sortedCols.length - 1}
                        canDelete={sortedCols.length > 2 && idx !== 0 && idx !== sortedCols.length - 1}
                        showArchived={showArchived}
                        filterLabelId={filterLabelId}
                        filterPersonId={filterPersonId}
                        persons={persons}
                        onRename={renameColumn}
                        onMove={moveColumn}
                        onDelete={deleteColumn}
                        onCreateCard={createCard}
                        onUpdateCard={updateCard}
                        onArchiveCard={archiveCard}
                        onRestoreCard={restoreCard}
                        onMoveCard={moveCard}
                        onReorderCard={reorderCard}
                        onToggleLabel={toggleCardLabel}
                        onCreateLabel={createLabel}
                    />
                ))}

                {/* Add column */}
                {isManager && configuring && sortedCols.length < maxColumns && (
                    <div style={{ minWidth: '200px', flex: '0 0 auto' }}>
                        <AddColumnForm onAdd={name => createColumn({ feature_instance_id: featureInstanceId, name })} />
                    </div>
                )}
            </div>

        </div>
    );
};

export default KanbanTab;
