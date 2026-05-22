import React, { useState, useEffect, useRef } from 'react';
import { useTranslation } from 'react-i18next';
import { useTheme } from '@/contexts/ThemeContext';
import { ThemedSvgIcon } from '@/components/common/icons/ThemedSvgIcon';
import { Tag, User } from 'lucide-react';
import { useKanban } from './hooks';
import KanbanColumnComponent from './KanbanColumn';

const compactBtn: React.CSSProperties = {
    padding: '4px 12px', fontSize: 'var(--font-xs)', fontWeight: 600,
    borderRadius: '6px', cursor: 'pointer', border: 'none', transition: 'all 0.15s',
};

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
    const [newColName, setNewColName] = useState('');
    const [showAddForm, setShowAddForm] = useState(false);
    const [submittingCol, setSubmittingCol] = useState(false);

    const [hoveredLabelId, setHoveredLabelId] = useState<string | null>(null);
    const [renamingLabelId, setRenamingLabelId] = useState<string | null>(null);
    const [renameLabelValue, setRenameLabelValue] = useState('');

    const initDone = useRef(false);
    const sortedCols = [...board.columns].sort((a, b) => a.position - b.position);
    const maxColumns = 4;

    const activeCardLabelIds = new Set(
        board.cards.filter(c => c.status === 'active').flatMap(c => c.label_ids)
    );
    const visibleLabels = board.labels.filter(l => activeCardLabelIds.has(l.id));

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

    const handleAddColumn = async (e: React.FormEvent) => {
        e.preventDefault();
        const name = newColName.trim();
        if (!name) return;
        setSubmittingCol(true);
        await createColumn({ feature_instance_id: featureInstanceId, name });
        setNewColName('');
        setSubmittingCol(false);
    };

    const handleDoneConfiguring = () => {
        setConfiguring(false);
        setShowAddForm(false);
        setNewColName('');
    };

    const handleRenameLabel = async (labelId: string) => {
        const name = renameLabelValue.trim();
        const original = board.labels.find(l => l.id === labelId)?.name;
        if (name && name !== original) await updateLabel(labelId, { name });
        setRenamingLabelId(null);
        setRenameLabelValue('');
    };

    return (
        <div>
            {error && (
                <div style={{ padding: '8px 12px', marginBottom: '12px', color: theme.colors.danger, fontSize: 'var(--font-sm)' }}>
                    {error}
                </div>
            )}

            {/* Top bar: label filters + actions */}
            <div style={{ display: 'flex', alignItems: 'center', gap: '8px', marginBottom: '10px' }}>
                {/* Label filters */}
                <div style={{ display: 'flex', flexWrap: 'wrap', gap: '6px', alignItems: 'center', flex: 1 }}>
                    {visibleLabels.length > 0 && (
                        <>
                            <Tag size={14} color={theme.colors.secondary} />
                            {visibleLabels.map(label => {
                                const active = filterLabelId === label.id;
                                const isRenaming = renamingLabelId === label.id;

                                if (isRenaming) {
                                    return (
                                        <input
                                            key={label.id}
                                            autoFocus
                                            value={renameLabelValue}
                                            onChange={e => setRenameLabelValue(e.target.value)}
                                            onKeyDown={e => {
                                                if (e.key === 'Enter') handleRenameLabel(label.id);
                                                if (e.key === 'Escape') { setRenamingLabelId(null); setRenameLabelValue(''); }
                                            }}
                                            onBlur={() => handleRenameLabel(label.id)}
                                            style={{ padding: '3px 8px', borderRadius: '12px', fontSize: 'var(--font-xs)', border: `1px solid ${label.color}`, backgroundColor: theme.colors.surface, color: theme.colors.text, width: '100px', outline: 'none' }}
                                        />
                                    );
                                }

                                return (
                                    <div
                                        key={label.id}
                                        style={{ display: 'flex', alignItems: 'center', gap: '2px' }}
                                        onMouseEnter={() => setHoveredLabelId(label.id)}
                                        onMouseLeave={() => setHoveredLabelId(null)}
                                    >
                                        <button
                                            type="button"
                                            onClick={() => setFilterLabelId(prev => prev === label.id ? null : label.id)}
                                            style={{
                                                padding: '4px 12px', borderRadius: '16px',
                                                fontSize: 'var(--font-xs)', fontWeight: active ? 700 : 500,
                                                cursor: 'pointer',
                                                border: `1px solid ${label.color}`,
                                                backgroundColor: active ? `${label.color}20` : 'transparent',
                                                color: label.color,
                                                transition: 'all 0.15s', whiteSpace: 'nowrap',
                                            }}
                                        >
                                            {label.name}
                                        </button>
                                        {isManager && hoveredLabelId === label.id && (
                                            <>
                                                <button
                                                    type="button"
                                                    title={t('features.kanban.renameLabel')}
                                                    onClick={() => { setRenamingLabelId(label.id); setRenameLabelValue(label.name); }}
                                                    style={{ background: 'none', border: 'none', cursor: 'pointer', padding: '2px', display: 'flex', alignItems: 'center', opacity: 0.6 }}
                                                >
                                                    <ThemedSvgIcon name="pencil" color={theme.colors.secondary} size={12} />
                                                </button>
                                                <button
                                                    type="button"
                                                    onClick={() => deleteLabel(label.id)}
                                                    style={{ background: 'none', border: 'none', cursor: 'pointer', padding: '2px', display: 'flex', alignItems: 'center', opacity: 0.6 }}
                                                >
                                                    <ThemedSvgIcon name="x" color={theme.colors.danger} size={12} />
                                                </button>
                                            </>
                                        )}
                                    </div>
                                );
                            })}
                        </>
                    )}
                </div>

                {/* Right actions */}
                <div style={{ display: 'flex', alignItems: 'center', gap: '8px', flexShrink: 0 }}>
                    {actions}

                    {canEdit && hasArchived && (
                        <button
                            onClick={() => setShowArchived(v => !v)}
                            title={showArchived ? t('features.kanban.hideArchived') : t('features.kanban.showArchived')}
                            style={{ background: showArchived ? theme.colors.secondary : 'none', border: `1px solid ${showArchived ? theme.colors.secondary : theme.colors.border}`, borderRadius: '6px', cursor: 'pointer', display: 'flex', alignItems: 'center', padding: '6px 10px' }}
                        >
                            <ThemedSvgIcon name={showArchived ? 'eye-off' : 'eye'} color={showArchived ? theme.colors.surface : theme.colors.secondary} size={16} />
                        </button>
                    )}

                    {isManager && (
                        <button
                            onClick={() => configuring ? handleDoneConfiguring() : setConfiguring(true)}
                            title={configuring ? t('features.kanban.saveColumns') : t('features.kanban.configureColumns')}
                            style={{ background: configuring ? theme.colors.primary : 'none', border: `1px solid ${configuring ? theme.colors.primary : theme.colors.border}`, borderRadius: '6px', cursor: 'pointer', display: 'flex', alignItems: 'center', padding: '6px 10px' }}
                        >
                            <ThemedSvgIcon name="settings" color={configuring ? theme.colors.surface : theme.colors.secondary} size={16} />
                        </button>
                    )}
                </div>
            </div>

            {/* Person filter row */}
            {assignedPersons.length > 0 && (
                <div style={{ display: 'flex', flexWrap: 'wrap', gap: '8px', marginBottom: '10px', alignItems: 'center' }}>
                    <User size={14} color={theme.colors.primary} />
                    {assignedPersons.map(person => {
                        const active = filterPersonId === person.id;
                        return (
                            <button
                                key={person.id}
                                type="button"
                                onClick={() => setFilterPersonId(prev => prev === person.id ? null : person.id)}
                                style={{
                                    padding: '4px 12px', borderRadius: '16px',
                                    fontSize: 'var(--font-xs)', fontWeight: active ? 700 : 500,
                                    cursor: 'pointer',
                                    border: `1px solid ${theme.colors.primary}`,
                                    backgroundColor: active ? theme.colors.primary : 'transparent',
                                    color: active ? theme.colors.surface : theme.colors.primary,
                                    transition: 'all 0.15s', whiteSpace: 'nowrap',
                                }}
                            >
                                {person.name}
                            </button>
                        );
                    })}
                </div>
            )}

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
                    <div style={{ minWidth: '200px', flex: '0 0 auto', display: 'flex', flexDirection: 'column', gap: '8px' }}>
                        {!showAddForm ? (
                            <button
                                onClick={() => setShowAddForm(true)}
                                style={{ padding: '10px 14px', border: `2px dashed ${theme.colors.border}`, borderRadius: '10px', background: 'none', cursor: 'pointer', color: theme.colors.secondary, fontSize: 'var(--font-sm)', textAlign: 'center', whiteSpace: 'nowrap', display: 'flex', alignItems: 'center', gap: '6px' }}
                            >
                                <ThemedSvgIcon name="plus" color={theme.colors.secondary} size={14} />
                                {t('features.kanban.addColumn')}
                            </button>
                        ) : (
                            <form onSubmit={handleAddColumn} style={{ display: 'flex', flexDirection: 'column', gap: '8px', padding: '12px', border: `1px solid ${theme.colors.border}`, borderRadius: '10px', backgroundColor: theme.colors.surface }}>
                                <input
                                    autoFocus value={newColName} onChange={e => setNewColName(e.target.value)}
                                    placeholder={t('features.kanban.addColumnPlaceholder')}
                                    onKeyDown={e => { if (e.key === 'Escape') { setShowAddForm(false); setNewColName(''); } }}
                                    style={{ padding: '7px 10px', border: `1px solid ${theme.colors.border}`, borderRadius: '6px', backgroundColor: theme.colors.surface, color: theme.colors.text, fontSize: 'var(--font-sm)' }}
                                />
                                <div style={{ display: 'flex', gap: '6px' }}>
                                    <button
                                        type="submit"
                                        disabled={!newColName.trim() || submittingCol}
                                        style={{ ...compactBtn, background: !newColName.trim() || submittingCol ? theme.colors.border : theme.colors.primary, color: !newColName.trim() || submittingCol ? theme.colors.secondary : theme.colors.surface }}
                                    >
                                        {t('features.kanban.addColumn')}
                                    </button>
                                    <button
                                        type="button"
                                        onClick={() => { setShowAddForm(false); setNewColName(''); }}
                                        style={{ ...compactBtn, background: theme.colors.surface, color: theme.colors.secondary, border: `1px solid ${theme.colors.border}` }}
                                    >
                                        {t('common.cancel')}
                                    </button>
                                </div>
                            </form>
                        )}
                    </div>
                )}
            </div>

        </div>
    );
};

export default KanbanTab;
