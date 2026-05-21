import React, { useState, useEffect, useRef } from 'react';
import { useTranslation } from 'react-i18next';
import { useTheme } from '@/contexts/ThemeContext';
import { ThemedButton } from '@/components/common/form/ThemedButton';
import { ThemedSvgIcon } from '@/components/common/icons/ThemedSvgIcon';
import { useKanban } from './hooks';
import KanbanColumnComponent from './KanbanColumn';

interface Props {
    featureInstanceId: string;
    canEdit: boolean;
    isManager: boolean;
    actions?: React.ReactNode;
}

const KanbanTab: React.FC<Props> = ({ featureInstanceId, canEdit, isManager, actions }) => {
    const { t } = useTranslation();
    const { theme } = useTheme();
    const { board, error, loaded, createColumn, renameColumn, deleteColumn, moveColumn, createCard, updateCard, archiveCard, moveCard } = useKanban(featureInstanceId);
    const [configuring, setConfiguring] = useState(false);
    const initDone = useRef(false);
    const [newColName, setNewColName] = useState('');
    const [showAddForm, setShowAddForm] = useState(false);
    const [submittingCol, setSubmittingCol] = useState(false);

    const sortedCols = [...board.columns].sort((a, b) => a.position - b.position);
    const maxColumns = 4;

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

    return (
        <div>
            {error && (
                <div style={{ padding: '8px 12px', marginBottom: '12px', color: theme.colors.danger, fontSize: 'var(--font-sm)' }}>
                    {error}
                </div>
            )}

            {(isManager || actions) && (
                <div style={{ display: 'flex', justifyContent: 'flex-end', alignItems: 'center', gap: '8px', marginBottom: '10px' }}>
                    {actions}
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
            )}

            <div style={{ display: 'flex', gap: '14px', alignItems: 'flex-start' }}>
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
                        onRename={renameColumn}
                        onMove={moveColumn}
                        onDelete={deleteColumn}
                        onCreateCard={createCard}
                        onUpdateCard={updateCard}
                        onArchiveCard={archiveCard}
                        onMoveCard={moveCard}
                    />
                ))}

                {canEdit && configuring && sortedCols.length < maxColumns && (
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
        </div>
    );
};

export default KanbanTab;
