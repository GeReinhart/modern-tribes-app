import React, { useState } from 'react';
import { useTranslation } from 'react-i18next';
import { useTheme } from '@/contexts/ThemeContext';
import { ThemedButton } from '@/components/common/form/ThemedButton';
import { ThemedSvgIcon } from '@/components/common/icons/ThemedSvgIcon';
import JoditEditorComponent from '@/components/common/editor/JoditEditorComponent';
import { KanbanCard, KanbanLabel, CardUpdate } from './types';

interface Props {
    card: KanbanCard;
    canEdit: boolean;
    boardLabels: KanbanLabel[];
    onUpdate: (cardId: string, data: CardUpdate) => Promise<void>;
    onToggleLabel: (cardId: string, labelId: string, currentLabelIds: string[]) => Promise<void>;
}

const KanbanCardBody: React.FC<Props> = ({ card, canEdit, boardLabels, onUpdate, onToggleLabel }) => {
    const { t } = useTranslation();
    const { theme } = useTheme();
    const [editing, setEditing] = useState(false);
    const [noteContent, setNoteContent] = useState(card.document_content_html ?? '');

    const handleSave = async () => {
        await onUpdate(card.id, { document_content_html: noteContent });
        setEditing(false);
    };

    const handleCancel = () => {
        setNoteContent(card.document_content_html ?? '');
        setEditing(false);
    };

    return (
        <div style={{ padding: '10px 14px 12px', borderTop: `1px solid ${theme.colors.border}` }}>
            {/* Labels */}
            {boardLabels.length > 0 && (
                <div style={{ display: 'flex', flexWrap: 'wrap', gap: '4px', marginBottom: '10px' }}>
                    {boardLabels.map(label => {
                        const active = card.label_ids.includes(label.id);
                        return (
                            <button
                                key={label.id}
                                onClick={() => canEdit ? onToggleLabel(card.id, label.id, card.label_ids) : undefined}
                                title={label.name}
                                style={{
                                    padding: '2px 8px',
                                    borderRadius: '10px',
                                    border: `1px solid ${label.color}`,
                                    background: active ? label.color : 'transparent',
                                    color: active ? theme.colors.surface : label.color,
                                    fontSize: '11px',
                                    fontWeight: 600,
                                    cursor: canEdit ? 'pointer' : 'default',
                                    transition: 'all 0.15s',
                                }}
                            >
                                {label.name}
                            </button>
                        );
                    })}
                </div>
            )}

            {/* Notes editor */}
            {editing ? (
                <>
                    <JoditEditorComponent content={noteContent} onChange={setNoteContent} minHeight={320} compact />
                    <div style={{ marginTop: '8px', display: 'flex', gap: '6px', justifyContent: 'flex-end' }}>
                        <ThemedButton variant="secondary" onClick={handleCancel}>{t('common.cancel')}</ThemedButton>
                        <ThemedButton variant="primary" onClick={handleSave}>{t('common.save')}</ThemedButton>
                    </div>
                </>
            ) : (
                <>
                    {card.document_content_html
                        ? <div className="prose max-w-none" style={{ fontSize: 'var(--font-sm)', color: theme.colors.text }} dangerouslySetInnerHTML={{ __html: card.document_content_html }} />
                        : <div style={{ fontSize: 'var(--font-sm)', color: theme.colors.secondary, fontStyle: 'italic' }}>{t('features.kanban.noDocument')}</div>
                    }
                    {canEdit && (
                        <div style={{ marginTop: '8px', display: 'flex', justifyContent: 'flex-end' }}>
                            <button
                                onClick={() => setEditing(true)}
                                title={t('common.edit')}
                                style={{ background: 'none', border: `1px solid ${theme.colors.border}`, borderRadius: '6px', cursor: 'pointer', color: theme.colors.secondary, padding: '5px 8px', display: 'flex', alignItems: 'center' }}
                            >
                                <ThemedSvgIcon name="pencil" color={theme.colors.secondary} size={15} />
                            </button>
                        </div>
                    )}
                </>
            )}
        </div>
    );
};

export default KanbanCardBody;
