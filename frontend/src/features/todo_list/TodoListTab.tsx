import React, { useRef, useState } from 'react';
import { useTranslation } from 'react-i18next';
import { useTheme } from '@/contexts/ThemeContext';
import { ThemedButton } from '@/components/common/form/ThemedButton';
import { ThemedText } from '@/components/common/layout/ThemedText';
import { ThemedSvgIcon } from '@/components/common/icons/ThemedSvgIcon';
import JoditEditorComponent from '@/components/common/editor/JoditEditorComponent';
import { useTodoItems } from './hooks';
import { TodoItem } from './types';

interface Props {
    featureInstanceId: string;
    canEdit: boolean;
    isManager: boolean;
    actions?: React.ReactNode;
}

const TodoRow: React.FC<{
    item: TodoItem;
    canEdit: boolean;
    onToggle: (id: string, done: boolean) => void;
    onSetStatus: (id: string, status: 'pending' | 'active' | 'archived') => void;
    onSaveNote: (id: string, html: string) => void;
    onRename: (id: string, title: string) => void;
}> = ({ item, canEdit, onToggle, onSetStatus, onSaveNote, onRename }) => {
    const { t } = useTranslation();
    const { theme } = useTheme();
    const [expanded, setExpanded] = useState(false);
    const [editing, setEditing] = useState(false);
    const [editTitle, setEditTitle] = useState(item.title);
    const [noteContent, setNoteContent] = useState(item.document_content_html ?? '');
    const [noteDirty, setNoteDirty] = useState(false);

    const handleStartEdit = () => {
        setEditTitle(item.title);
        setEditing(true);
    };

    const handleCommitEdit = () => {
        const trimmed = editTitle.trim();
        if (trimmed && trimmed !== item.title) onRename(item.id, trimmed);
        setEditing(false);
    };

    const handleEditKeyDown = (e: React.KeyboardEvent<HTMLInputElement>) => {
        if (e.key === 'Enter') { e.preventDefault(); handleCommitEdit(); }
        if (e.key === 'Escape') { setEditing(false); setEditTitle(item.title); }
    };

    const handleNoteChange = (html: string) => {
        setNoteContent(html);
        setNoteDirty(true);
    };

    const handleSaveNote = () => {
        onSaveNote(item.id, noteContent);
        setNoteDirty(false);
    };

    const isDone = item.todo_status === 'done';
    const isArchived = item.status === 'archived';

    return (
        <div style={{
            borderRadius: '8px',
            border: `1px solid ${theme.colors.border}`,
            marginBottom: '8px',
            overflow: 'hidden',
            backgroundColor: theme.colors.surface,
        }}>
            <div style={{
                display: 'flex',
                alignItems: 'center',
                gap: '10px',
                padding: '10px 14px',
            }}>
                {canEdit && !isArchived && (
                    <input
                        type="checkbox"
                        checked={isDone}
                        onChange={e => onToggle(item.id, e.target.checked)}
                        style={{ width: 18, height: 18, cursor: 'pointer', flexShrink: 0 }}
                    />
                )}
                {(!canEdit || isArchived) && (
                    <span style={{
                        width: 18, height: 18, flexShrink: 0,
                        border: `2px solid ${theme.colors.border}`,
                        borderRadius: '3px',
                        backgroundColor: isDone ? theme.colors.primary : 'transparent',
                        display: 'inline-block',
                    }} />
                )}
                {canEdit && editing && !isArchived ? (
                    <input
                        autoFocus
                        value={editTitle}
                        onChange={e => setEditTitle(e.target.value)}
                        onBlur={handleCommitEdit}
                        onKeyDown={handleEditKeyDown}
                        style={{
                            flex: 1,
                            fontSize: 'var(--font-md)',
                            padding: '2px 6px',
                            border: `1px solid ${theme.colors.primary}`,
                            borderRadius: '4px',
                            backgroundColor: theme.colors.surface,
                            color: theme.colors.text,
                            outline: 'none',
                        }}
                    />
                ) : (
                    <span
                        style={{
                            flex: 1,
                            textDecoration: isDone || isArchived ? 'line-through' : 'none',
                            color: isArchived ? theme.colors.secondary : isDone ? theme.colors.secondary : theme.colors.text,
                            fontSize: 'var(--font-md)',
                            cursor: canEdit && !isArchived ? 'text' : 'default',
                            opacity: isArchived ? 0.55 : 1,
                        }}
                        onClick={() => canEdit && !isArchived ? handleStartEdit() : setExpanded(e => !e)}
                    >
                        {item.title}
                    </span>
                )}
                <button
                    onClick={() => setExpanded(e => !e)}
                    style={{
                        background: 'none',
                        border: 'none',
                        cursor: 'pointer',
                        color: theme.colors.secondary,
                        padding: '2px 6px',
                        display: 'flex',
                        alignItems: 'center',
                    }}
                >
                    <ThemedSvgIcon name={expanded ? 'chevron-up' : 'chevron-down'} color={theme.colors.secondary} size={14} />
                </button>
                {canEdit && !isArchived && (
                    <button
                        onClick={() => onSetStatus(item.id, 'archived')}
                        style={{
                            background: 'none',
                            border: 'none',
                            cursor: 'pointer',
                            color: theme.colors.secondary,
                            fontSize: '13px',
                            padding: '2px 6px',
                            lineHeight: 1,
                        }}
                        title={t('common.archive')}
                    >
                        {t('common.archive')}
                    </button>
                )}
                {canEdit && isArchived && (
                    <button
                        onClick={() => onSetStatus(item.id, 'active')}
                        style={{
                            background: 'none',
                            border: 'none',
                            cursor: 'pointer',
                            color: theme.colors.primary,
                            fontSize: '13px',
                            padding: '2px 6px',
                            lineHeight: 1,
                        }}
                        title={t('common.restore')}
                    >
                        {t('common.restore')}
                    </button>
                )}
            </div>

            {expanded && (
                <div style={{ padding: '0 14px 12px 14px', borderTop: `1px solid ${theme.colors.border}` }}>
                    <div style={{ paddingTop: '10px' }}>
                        {canEdit ? (
                            <>
                                <JoditEditorComponent
                                    content={noteContent}
                                    onChange={handleNoteChange}
                                    minHeight={200}
                                />
                                {noteDirty && (
                                    <div style={{ marginTop: '8px', display: 'flex', justifyContent: 'flex-end' }}>
                                        <ThemedButton variant="primary" onClick={handleSaveNote}>
                                            {t('common.save')}
                                        </ThemedButton>
                                    </div>
                                )}
                            </>
                        ) : (
                            item.document_content_html ? (
                                <div
                                    className="prose max-w-none"
                                    style={{ fontSize: 'var(--font-sm)', color: theme.colors.text }}
                                    dangerouslySetInnerHTML={{ __html: item.document_content_html }}
                                />
                            ) : (
                                <ThemedText variant="secondary" size="small">{t('features.todo.noNote')}</ThemedText>
                            )
                        )}
                    </div>
                </div>
            )}
        </div>
    );
};

const TodoListTab: React.FC<Props> = ({ featureInstanceId, canEdit }) => {
    const { t } = useTranslation();
    const { theme } = useTheme();
    const { items, error, createItem, updateItem } = useTodoItems(featureInstanceId);
    const [newTitle, setNewTitle] = useState('');
    const [adding, setAdding] = useState(false);
    const [showArchived, setShowArchived] = useState(false);
    const addInputRef = useRef<HTMLInputElement>(null);

    const handleAdd = async (e: React.FormEvent) => {
        e.preventDefault();
        if (!newTitle.trim()) return;
        setAdding(true);
        await createItem({
            feature_instance_id: featureInstanceId,
            title: newTitle.trim(),
            position: items.length,
        });
        setNewTitle('');
        setAdding(false);
        setTimeout(() => addInputRef.current?.focus(), 0);
    };

    const handleToggle = async (id: string, done: boolean) => {
        await updateItem(id, { todo_status: done ? 'done' : 'todo' });
    };

    const handleSaveNote = async (id: string, html: string) => {
        await updateItem(id, { document_content_html: html });
    };

    const handleRename = async (id: string, title: string) => {
        await updateItem(id, { title });
    };

    const handleSetStatus = async (id: string, status: 'pending' | 'active' | 'archived') => {
        await updateItem(id, { status });
    };

    const archivedCount = items.filter(i => i.status === 'archived').length;
    const visibleItems = showArchived ? items : items.filter(i => i.status !== 'archived');

    return (
        <div>
            {error && (
                <div style={{ padding: '8px 12px', marginBottom: '12px', color: theme.colors.danger, fontSize: 'var(--font-sm)' }}>
                    {error}
                </div>
            )}

            <div style={{ marginBottom: '16px' }}>
                {visibleItems.length === 0 && items.length === 0 && (
                    <ThemedText variant="secondary" size="small" style={{ marginBottom: '12px' }}>
                        {t('features.todo.empty')}
                    </ThemedText>
                )}
                {visibleItems.map(item => (
                    <TodoRow
                        key={item.id}
                        item={item}
                        canEdit={canEdit}
                        onToggle={handleToggle}
                        onSetStatus={handleSetStatus}
                        onSaveNote={handleSaveNote}
                        onRename={handleRename}
                    />
                ))}
                {archivedCount > 0 && (
                    <button
                        onClick={() => setShowArchived(s => !s)}
                        style={{
                            background: 'none',
                            border: 'none',
                            cursor: 'pointer',
                            color: theme.colors.secondary,
                            fontSize: 'var(--font-sm)',
                            padding: '6px 0',
                            display: 'block',
                            marginTop: '4px',
                        }}
                    >
                        {showArchived
                            ? t('features.todo.hideArchived')
                            : t('features.todo.showArchived', { count: archivedCount })}
                    </button>
                )}
            </div>

            {canEdit && (
                <form onSubmit={handleAdd} style={{ display: 'flex', gap: '8px', alignItems: 'center' }}>
                    <input
                        ref={addInputRef}
                        type="text"
                        value={newTitle}
                        onChange={e => setNewTitle(e.target.value)}
                        placeholder={t('features.todo.addPlaceholder')}
                        style={{
                            flex: 1,
                            padding: '8px 12px',
                            border: `1px solid ${theme.colors.border}`,
                            borderRadius: '8px',
                            backgroundColor: theme.colors.surface,
                            color: theme.colors.text,
                            fontSize: 'var(--font-sm)',
                        }}
                        disabled={adding}
                    />
                    <ThemedButton variant="primary" type="submit" disabled={adding || !newTitle.trim()}>
                        {t('features.todo.add')}
                    </ThemedButton>
                </form>
            )}
        </div>
    );
};

export default TodoListTab;
