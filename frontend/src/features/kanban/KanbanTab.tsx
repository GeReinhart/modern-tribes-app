import React, { useState, useEffect, useRef } from 'react';
import { useTranslation } from 'react-i18next';
import { useTheme } from '@/contexts/ThemeContext';
import { ThemedButton } from '@/components/common/form/ThemedButton';
import { ThemedSvgIcon } from '@/components/common/icons/ThemedSvgIcon';
import { Tag } from 'lucide-react';
import { useKanban } from './hooks';
import { LabelCreate } from './types';
import KanbanColumnComponent from './KanbanColumn';

const LABEL_COLORS = ['#ef4444', '#f97316', '#eab308', '#22c55e', '#3b82f6', '#8b5cf6', '#ec4899', '#6b7280'];

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
        createLabel, deleteLabel, toggleCardLabel,
    } = useKanban(featureInstanceId);

    const [configuring, setConfiguring] = useState(false);
    const [showArchived, setShowArchived] = useState(false);
    const [filterLabelId, setFilterLabelId] = useState<string | null>(null);
    const [newColName, setNewColName] = useState('');
    const [showAddForm, setShowAddForm] = useState(false);
    const [submittingCol, setSubmittingCol] = useState(false);

    // New label form state
    const [newLabelName, setNewLabelName] = useState('');
    const [newLabelColor, setNewLabelColor] = useState(LABEL_COLORS[0]);

    const initDone = useRef(false);
    const sortedCols = [...board.columns].sort((a, b) => a.position - b.position);
    const maxColumns = 4;

    const hasArchived = board.cards.some(c => c.status === 'archived');

    useEffect(() => {
        if (!loaded || initDone.current || !isManager) return;
        initDone.current = true;
        if (board.columns.length === 0) setConfiguring(true);
    }, [loaded, board.columns.length, isManager]);

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

    const handleAddLabel = async (e: React.FormEvent) => {
        e.preventDefault();
        const name = newLabelName.trim();
        if (!name) return;
        await createLabel({ feature_instance_id: featureInstanceId, name, color: newLabelColor } as LabelCreate);
        setNewLabelName('');
        setNewLabelColor(LABEL_COLORS[0]);
    };

    return (
        <div>
            {error && (
                <div style={{ padding: '8px 12px', marginBottom: '12px', color: theme.colors.danger, fontSize: 'var(--font-sm)' }}>
                    {error}
                </div>
            )}

            {/* Label filter row */}
            {board.labels.length > 0 && (
                <div style={{ display: 'flex', flexWrap: 'wrap', gap: '8px', marginBottom: '14px', alignItems: 'center' }}>
                    <Tag size={14} color={theme.colors.secondary} />
                    {board.labels.map(label => {
                        const active = filterLabelId === label.id;
                        return (
                            <button
                                key={label.id}
                                type="button"
                                onClick={() => setFilterLabelId(prev => prev === label.id ? null : label.id)}
                                style={{
                                    padding: '4px 12px', borderRadius: '16px',
                                    fontSize: 'var(--font-xs)', fontWeight: 500,
                                    cursor: 'pointer',
                                    border: `1px solid ${active ? label.color : theme.colors.border}`,
                                    backgroundColor: active ? `${label.color}20` : theme.colors.surface,
                                    color: active ? label.color : theme.colors.secondary,
                                    transition: 'all 0.15s', whiteSpace: 'nowrap',
                                }}
                            >
                                {label.name}
                            </button>
                        );
                    })}
                </div>
            )}

            {/* Action toolbar */}
            <div style={{ display: 'flex', justifyContent: 'flex-end', alignItems: 'center', gap: '8px', marginBottom: '10px' }}>
                {actions}

                {/* Show archived toggle — eye icon */}
                {canEdit && hasArchived && (
                    <button
                        onClick={() => setShowArchived(v => !v)}
                        title={showArchived ? t('features.kanban.hideArchived') : t('features.kanban.showArchived')}
                        style={{ background: showArchived ? theme.colors.secondary : 'none', border: `1px solid ${showArchived ? theme.colors.secondary : theme.colors.border}`, borderRadius: '6px', cursor: 'pointer', display: 'flex', alignItems: 'center', padding: '6px 10px' }}
                    >
                        <ThemedSvgIcon name={showArchived ? 'eye-off' : 'eye'} color={showArchived ? '#fff' : theme.colors.secondary} size={16} />
                    </button>
                )}

                {/* Configure columns — settings icon */}
                {isManager && (
                    <button
                        onClick={() => configuring ? handleDoneConfiguring() : setConfiguring(true)}
                        title={configuring ? t('features.kanban.saveColumns') : t('features.kanban.configureColumns')}
                        style={{ background: configuring ? theme.colors.primary : 'none', border: `1px solid ${configuring ? theme.colors.primary : theme.colors.border}`, borderRadius: '6px', cursor: 'pointer', display: 'flex', alignItems: 'center', padding: '6px 10px' }}
                    >
                        <ThemedSvgIcon name="settings" color={configuring ? '#fff' : theme.colors.secondary} size={16} />
                    </button>
                )}
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
                                    <ThemedButton variant="primary" type="submit" disabled={!newColName.trim() || submittingCol}>{t('features.kanban.addColumn')}</ThemedButton>
                                    <ThemedButton variant="secondary" type="button" onClick={() => { setShowAddForm(false); setNewColName(''); }}>{t('common.cancel')}</ThemedButton>
                                </div>
                            </form>
                        )}
                    </div>
                )}
            </div>

            {/* Label management (configure mode, manager only) */}
            {isManager && configuring && (
                <div style={{ marginTop: '20px', padding: '16px', border: `1px solid ${theme.colors.border}`, borderRadius: '10px', backgroundColor: theme.colors.surface }}>
                    <div style={{ fontWeight: 600, fontSize: 'var(--font-sm)', color: theme.colors.text, marginBottom: '10px' }}>{t('features.kanban.manageLabels')}</div>

                    {/* Existing labels */}
                    <div style={{ display: 'flex', flexWrap: 'wrap', gap: '6px', marginBottom: '12px' }}>
                        {board.labels.map(label => (
                            <div key={label.id} style={{ display: 'flex', alignItems: 'center', gap: '4px', padding: '3px 8px', borderRadius: '10px', border: `1px solid ${label.color}`, background: label.color + '22' }}>
                                <span style={{ width: '8px', height: '8px', borderRadius: '50%', background: label.color, flexShrink: 0 }} />
                                <span style={{ fontSize: '12px', fontWeight: 600, color: label.color }}>{label.name}</span>
                                <button onClick={() => deleteLabel(label.id)} style={{ background: 'none', border: 'none', cursor: 'pointer', color: theme.colors.danger, padding: '0 2px', display: 'flex', alignItems: 'center', marginLeft: '2px' }}>
                                    <ThemedSvgIcon name="x" color={theme.colors.danger} size={12} />
                                </button>
                            </div>
                        ))}
                        {board.labels.length === 0 && (
                            <span style={{ fontSize: 'var(--font-sm)', color: theme.colors.secondary, fontStyle: 'italic' }}>{t('features.kanban.noLabels')}</span>
                        )}
                    </div>

                    {/* New label form */}
                    <form onSubmit={handleAddLabel} style={{ display: 'flex', gap: '8px', alignItems: 'center', flexWrap: 'wrap' }}>
                        <input
                            value={newLabelName} onChange={e => setNewLabelName(e.target.value)}
                            placeholder={t('features.kanban.newLabelPlaceholder')}
                            style={{ padding: '5px 9px', border: `1px solid ${theme.colors.border}`, borderRadius: '6px', backgroundColor: theme.colors.surface, color: theme.colors.text, fontSize: 'var(--font-sm)', width: '140px' }}
                        />
                        <div style={{ display: 'flex', gap: '4px' }}>
                            {LABEL_COLORS.map(c => (
                                <button
                                    key={c} type="button"
                                    onClick={() => setNewLabelColor(c)}
                                    style={{ width: '20px', height: '20px', borderRadius: '50%', background: c, border: newLabelColor === c ? `2px solid ${theme.colors.text}` : '2px solid transparent', cursor: 'pointer', padding: 0 }}
                                />
                            ))}
                        </div>
                        <ThemedButton variant="primary" type="submit" disabled={!newLabelName.trim()}>{t('features.kanban.addLabel')}</ThemedButton>
                    </form>
                </div>
            )}
        </div>
    );
};

export default KanbanTab;
