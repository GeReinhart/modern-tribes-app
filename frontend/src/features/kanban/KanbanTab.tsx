import React, { useState } from 'react';
import { useTranslation } from 'react-i18next';
import { useTheme } from '@/contexts/ThemeContext';
import { ThemedButton } from '@/components/common/form/ThemedButton';
import { useKanban } from './hooks';
import KanbanColumnComponent from './KanbanColumn';

interface Props {
    featureInstanceId: string;
    canEdit: boolean;
    actions?: React.ReactNode;
}

const KanbanTab: React.FC<Props> = ({ featureInstanceId, canEdit, actions }) => {
    const { t } = useTranslation();
    const { theme } = useTheme();
    const { board, error, createColumn, renameColumn, deleteColumn, moveColumn, createCard, updateCard, archiveCard, moveCard } = useKanban(featureInstanceId);
    const [configuring, setConfiguring] = useState(true);
    const [newColName, setNewColName] = useState('');
    const [showAddForm, setShowAddForm] = useState(false);
    const [submittingCol, setSubmittingCol] = useState(false);

    const sortedCols = [...board.columns].sort((a, b) => a.position - b.position);
    const maxColumns = 4;


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

            {(canEdit || actions) && (
                <div style={{ display: 'flex', justifyContent: 'flex-end', alignItems: 'center', gap: '8px', marginBottom: '10px' }}>
                    {actions}
                    {canEdit && (
                        <button
                            onClick={() => configuring ? handleDoneConfiguring() : setConfiguring(true)}
                            title={configuring ? t('features.kanban.saveColumns') : t('features.kanban.configureColumns')}
                            style={{ background: configuring ? theme.colors.primary : 'none', border: `1px solid ${configuring ? theme.colors.primary : theme.colors.border}`, borderRadius: '6px', cursor: 'pointer', color: configuring ? '#fff' : theme.colors.secondary, fontSize: '16px', padding: '4px 10px', lineHeight: 1 }}
                        >
                            ⚙
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
                        configuring={configuring}
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
                                style={{ padding: '10px 14px', border: `2px dashed ${theme.colors.border}`, borderRadius: '10px', background: 'none', cursor: 'pointer', color: theme.colors.secondary, fontSize: 'var(--font-sm)', textAlign: 'center', whiteSpace: 'nowrap' }}
                            >
                                + {t('features.kanban.addColumn')}
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
