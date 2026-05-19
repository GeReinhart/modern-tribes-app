import React, { useState } from 'react';
import { useTranslation } from 'react-i18next';
import { useTheme } from '@/contexts/ThemeContext';
import { ThemedButton } from '@/components/common/form/ThemedButton';
import { ThemedText } from '@/components/common/layout/ThemedText';
import JoditEditorComponent from '@/components/common/editor/JoditEditorComponent';
import { useTodoItems } from './hooks';
import { TodoItem } from './types';

interface Props {
    featureInstanceId: string;
    canEdit: boolean;
}

const TodoRow: React.FC<{
    item: TodoItem;
    canEdit: boolean;
    onToggle: (id: string, done: boolean) => void;
    onDelete: (id: string) => void;
    onSaveNote: (id: string, html: string) => void;
}> = ({ item, canEdit, onToggle, onDelete, onSaveNote }) => {
    const { t } = useTranslation();
    const { theme } = useTheme();
    const [expanded, setExpanded] = useState(false);
    const [noteContent, setNoteContent] = useState(item.document_content_html ?? '');
    const [noteDirty, setNoteDirty] = useState(false);

    const handleNoteChange = (html: string) => {
        setNoteContent(html);
        setNoteDirty(true);
    };

    const handleSaveNote = () => {
        onSaveNote(item.id, noteContent);
        setNoteDirty(false);
    };

    const isDone = item.status === 'done';

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
                {canEdit && (
                    <input
                        type="checkbox"
                        checked={isDone}
                        onChange={e => onToggle(item.id, e.target.checked)}
                        style={{ width: 18, height: 18, cursor: 'pointer', flexShrink: 0 }}
                    />
                )}
                {!canEdit && (
                    <span style={{
                        width: 18, height: 18, flexShrink: 0,
                        border: `2px solid ${theme.colors.border}`,
                        borderRadius: '3px',
                        backgroundColor: isDone ? theme.colors.primary : 'transparent',
                        display: 'inline-block',
                    }} />
                )}
                <span
                    style={{
                        flex: 1,
                        textDecoration: isDone ? 'line-through' : 'none',
                        color: isDone ? theme.colors.secondary : theme.colors.text,
                        fontSize: 'var(--font-sm)',
                        cursor: 'pointer',
                    }}
                    onClick={() => setExpanded(e => !e)}
                >
                    {item.title}
                </span>
                <button
                    onClick={() => setExpanded(e => !e)}
                    style={{
                        background: 'none',
                        border: 'none',
                        cursor: 'pointer',
                        color: theme.colors.secondary,
                        fontSize: '12px',
                        padding: '2px 6px',
                    }}
                >
                    {expanded ? '▲' : '▼'}
                </button>
                {canEdit && (
                    <button
                        onClick={() => onDelete(item.id)}
                        style={{
                            background: 'none',
                            border: 'none',
                            cursor: 'pointer',
                            color: theme.colors.danger,
                            fontSize: '16px',
                            padding: '2px 4px',
                            lineHeight: 1,
                        }}
                        title={t('common.delete')}
                    >
                        ×
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
    const { items, error, createItem, updateItem, deleteItem } = useTodoItems(featureInstanceId);
    const [newTitle, setNewTitle] = useState('');
    const [adding, setAdding] = useState(false);

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
    };

    const handleToggle = async (id: string, done: boolean) => {
        await updateItem(id, { status: done ? 'done' : 'todo' });
    };

    const handleDelete = async (id: string) => {
        await deleteItem(id);
    };

    const handleSaveNote = async (id: string, html: string) => {
        await updateItem(id, { document_content_html: html });
    };

    return (
        <div>
            {error && (
                <div style={{ padding: '8px 12px', marginBottom: '12px', color: theme.colors.danger, fontSize: 'var(--font-sm)' }}>
                    {error}
                </div>
            )}

            <div style={{ marginBottom: '16px' }}>
                {items.length === 0 && (
                    <ThemedText variant="secondary" size="small" style={{ marginBottom: '12px' }}>
                        {t('features.todo.empty')}
                    </ThemedText>
                )}
                {items.map(item => (
                    <TodoRow
                        key={item.id}
                        item={item}
                        canEdit={canEdit}
                        onToggle={handleToggle}
                        onDelete={handleDelete}
                        onSaveNote={handleSaveNote}
                    />
                ))}
            </div>

            {canEdit && (
                <form onSubmit={handleAdd} style={{ display: 'flex', gap: '8px', alignItems: 'center' }}>
                    <input
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
