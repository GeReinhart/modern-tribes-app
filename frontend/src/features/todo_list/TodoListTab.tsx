import React, { useRef, useState, useEffect } from 'react';
import { useTranslation } from 'react-i18next';
import { useTheme } from '@/contexts/ThemeContext';
import { ThemedButton } from '@/components/common/form/ThemedButton';
import { ThemedSvgIcon } from '@/components/common/icons/ThemedSvgIcon';
import { Tag, User } from 'lucide-react';
import { useTodoList } from './hooks';
import TodoRow from './TodoRow';

interface Props {
    featureInstanceId: string;
    canEdit: boolean;
    isManager: boolean;
    actions?: React.ReactNode;
}

const TodoListTab: React.FC<Props> = ({ featureInstanceId, canEdit, isManager, actions }) => {
    const { t } = useTranslation();
    const { theme } = useTheme();
    const { items, labels, persons, error, createItem, updateItem, createLabel, updateLabel, deleteLabel, toggleLabel } = useTodoList(featureInstanceId);

    const [newTitle, setNewTitle] = useState('');
    const [adding, setAdding] = useState(false);
    const [showArchived, setShowArchived] = useState(false);
    const [filterLabelId, setFilterLabelId] = useState<string | null>(null);
    const [filterPersonId, setFilterPersonId] = useState<string | null>(null);
    const [hoveredLabelId, setHoveredLabelId] = useState<string | null>(null);
    const [renamingLabelId, setRenamingLabelId] = useState<string | null>(null);
    const [renameLabelValue, setRenameLabelValue] = useState('');
    const addInputRef = useRef<HTMLInputElement>(null);

    const activeItems = items.filter(i => i.status !== 'archived');
    const archivedCount = items.filter(i => i.status === 'archived').length;

    const activeItemLabelIds = new Set(activeItems.flatMap(i => i.label_ids));
    const visibleLabels = labels.filter(l => activeItemLabelIds.has(l.id));
    const assignedPersons = persons.filter(p => activeItems.some(i => i.assigned_person_id === p.id));

    useEffect(() => {
        if (filterLabelId && !activeItemLabelIds.has(filterLabelId)) setFilterLabelId(null);
    }, [items, filterLabelId]);

    const visibleItems = items
        .filter(i => showArchived || i.status !== 'archived')
        .filter(i => !filterLabelId || i.label_ids.includes(filterLabelId))
        .filter(i => !filterPersonId || i.assigned_person_id === filterPersonId);

    const handleAdd = async (e: React.FormEvent) => {
        e.preventDefault();
        if (!newTitle.trim()) return;
        setAdding(true);
        await createItem({ feature_instance_id: featureInstanceId, title: newTitle.trim(), position: items.length });
        setNewTitle('');
        setAdding(false);
        setTimeout(() => addInputRef.current?.focus(), 0);
    };

    const handleRenameLabel = async (labelId: string) => {
        const name = renameLabelValue.trim();
        const original = labels.find(l => l.id === labelId)?.name;
        if (name && name !== original) await updateLabel(labelId, { name });
        setRenamingLabelId(null);
        setRenameLabelValue('');
    };

    return (
        <div>
            {error && <div style={{ padding: '8px 12px', marginBottom: '12px', color: theme.colors.danger, fontSize: 'var(--font-sm)' }}>{error}</div>}

            {/* Top bar: label filters + right actions */}
            <div style={{ display: 'flex', alignItems: 'center', gap: '8px', marginBottom: '10px' }}>
                <div style={{ display: 'flex', flexWrap: 'wrap', gap: '6px', alignItems: 'center', flex: 1 }}>
                    {visibleLabels.length > 0 && (
                        <>
                            <Tag size={14} color={theme.colors.secondary} />
                            {visibleLabels.map(label => {
                                const active = filterLabelId === label.id;
                                if (renamingLabelId === label.id) {
                                    return (
                                        <input key={label.id} autoFocus value={renameLabelValue}
                                            onChange={e => setRenameLabelValue(e.target.value)}
                                            onKeyDown={e => { if (e.key === 'Enter') handleRenameLabel(label.id); if (e.key === 'Escape') { setRenamingLabelId(null); setRenameLabelValue(''); } }}
                                            onBlur={() => handleRenameLabel(label.id)}
                                            style={{ padding: '3px 8px', borderRadius: '12px', fontSize: 'var(--font-xs)', border: `1px solid ${label.color}`, backgroundColor: theme.colors.surface, color: theme.colors.text, width: '100px', outline: 'none' }} />
                                    );
                                }
                                return (
                                    <div key={label.id} style={{ display: 'flex', alignItems: 'center', gap: '2px' }}
                                        onMouseEnter={() => setHoveredLabelId(label.id)} onMouseLeave={() => setHoveredLabelId(null)}>
                                        <button type="button" onClick={() => setFilterLabelId(prev => prev === label.id ? null : label.id)}
                                            style={{ padding: '4px 12px', borderRadius: '16px', fontSize: 'var(--font-xs)', fontWeight: active ? 700 : 500, cursor: 'pointer', border: `1px solid ${label.color}`, backgroundColor: active ? `${label.color}20` : 'transparent', color: label.color, transition: 'all 0.15s', whiteSpace: 'nowrap' }}>
                                            {label.name}
                                        </button>
                                        {isManager && hoveredLabelId === label.id && (
                                            <>
                                                <button type="button" title={t('features.kanban.renameLabel')} onClick={() => { setRenamingLabelId(label.id); setRenameLabelValue(label.name); }}
                                                    style={{ background: 'none', border: 'none', cursor: 'pointer', padding: '2px', display: 'flex', alignItems: 'center', opacity: 0.6 }}>
                                                    <ThemedSvgIcon name="pencil" color={theme.colors.secondary} size={12} />
                                                </button>
                                                <button type="button" onClick={() => deleteLabel(label.id)}
                                                    style={{ background: 'none', border: 'none', cursor: 'pointer', padding: '2px', display: 'flex', alignItems: 'center', opacity: 0.6 }}>
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
                <div style={{ display: 'flex', alignItems: 'center', gap: '8px', flexShrink: 0 }}>
                    {actions}
                    {archivedCount > 0 && (
                        <button onClick={() => setShowArchived(s => !s)} title={showArchived ? t('features.todo.hideArchived') : t('features.todo.showArchived', { count: archivedCount })}
                            style={{ background: showArchived ? theme.colors.secondary : 'none', border: `1px solid ${showArchived ? theme.colors.secondary : theme.colors.border}`, borderRadius: '6px', cursor: 'pointer', display: 'flex', alignItems: 'center', padding: '6px 10px' }}>
                            <ThemedSvgIcon name={showArchived ? 'eye-off' : 'eye'} color={showArchived ? theme.colors.surface : theme.colors.secondary} size={16} />
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
                            <button key={person.id} type="button" onClick={() => setFilterPersonId(prev => prev === person.id ? null : person.id)}
                                style={{ padding: '4px 12px', borderRadius: '16px', fontSize: 'var(--font-xs)', fontWeight: active ? 700 : 500, cursor: 'pointer', border: `1px solid ${theme.colors.primary}`, backgroundColor: active ? theme.colors.primary : 'transparent', color: active ? theme.colors.surface : theme.colors.primary, transition: 'all 0.15s', whiteSpace: 'nowrap' }}>
                                {person.name}
                            </button>
                        );
                    })}
                </div>
            )}

            <div style={{ marginBottom: '16px' }}>
                {visibleItems.length === 0 && items.length === 0 && (
                    <span style={{ fontSize: 'var(--font-sm)', color: theme.colors.secondary }}>{t('features.todo.empty')}</span>
                )}
                {visibleItems.map(item => (
                    <TodoRow key={item.id} item={item} labels={labels} persons={persons}
                        canEdit={canEdit} isManager={isManager} featureInstanceId={featureInstanceId}
                        onToggle={(id, done) => updateItem(id, { todo_status: done ? 'done' : 'todo' })}
                        onSetStatus={(id, s) => updateItem(id, { status: s })}
                        onUpdate={updateItem} onToggleLabel={toggleLabel} onCreateLabel={createLabel}
                    />
                ))}
            </div>

            {canEdit && (
                <form onSubmit={handleAdd} style={{ display: 'flex', gap: '8px', alignItems: 'center' }}>
                    <input ref={addInputRef} type="text" value={newTitle} onChange={e => setNewTitle(e.target.value)}
                        placeholder={t('features.todo.addPlaceholder')} disabled={adding}
                        style={{ flex: 1, padding: '8px 12px', border: `1px solid ${theme.colors.border}`, borderRadius: '8px', backgroundColor: theme.colors.surface, color: theme.colors.text, fontSize: 'var(--font-sm)' }} />
                    <ThemedButton variant="primary" type="submit" disabled={adding || !newTitle.trim()}>{t('features.todo.add')}</ThemedButton>
                </form>
            )}
        </div>
    );
};

export default TodoListTab;
