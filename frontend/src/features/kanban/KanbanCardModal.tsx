import React, { useState, useEffect } from 'react';
import { useTranslation } from 'react-i18next';
import { useTheme } from '@/contexts/ThemeContext';
import { ThemedButton } from '@/components/common/form/ThemedButton';
import { ThemedSvgIcon } from '@/components/common/icons/ThemedSvgIcon';
import JoditEditorComponent from '@/components/common/editor/JoditEditorComponent';
import { LABEL_COLORS } from '@/components/themes/themes';
import ThemedDateSelection from '@/components/common/form/ThemedDateSelection';
import { KanbanCard, KanbanLabel, PersonOption, CardUpdate, LabelCreate, FIBONACCI, fibColor } from './types';

interface Props {
    card: KanbanCard;
    boardLabels: KanbanLabel[];
    persons: PersonOption[];
    canEdit: boolean;
    onClose: () => void;
    onUpdate: (cardId: string, data: CardUpdate) => Promise<void>;
    onToggleLabel: (cardId: string, labelId: string, currentLabelIds: string[]) => Promise<void>;
    onCreateLabel: (data: LabelCreate) => Promise<KanbanLabel | null>;
}

const KanbanCardModal: React.FC<Props> = ({
    card, boardLabels, persons, canEdit, onClose, onUpdate, onToggleLabel, onCreateLabel,
}) => {
    const { t } = useTranslation();
    const { theme } = useTheme();

    const [title, setTitle] = useState(card.title);
    const [assigneeId, setAssigneeId] = useState(card.assigned_person_id ?? '');
    const [size, setSize] = useState<number | null>(card.size);
    const [dueDate, setDueDate] = useState(card.due_date ?? '');
    const [notes, setNotes] = useState(card.document_content_html ?? '');
    const [saving, setSaving] = useState(false);

    // Local label state for immediate visual feedback
    const [localLabelIds, setLocalLabelIds] = useState<string[]>(card.label_ids);

    // New label form
    const [showNewLabel, setShowNewLabel] = useState(false);
    const [newLabelName, setNewLabelName] = useState('');
    const [newLabelColor, setNewLabelColor] = useState(LABEL_COLORS[0]);
    const [addingLabel, setAddingLabel] = useState(false);

    // Close on Escape
    useEffect(() => {
        const handler = (e: KeyboardEvent) => { if (e.key === 'Escape') onClose(); };
        window.addEventListener('keydown', handler);
        return () => window.removeEventListener('keydown', handler);
    }, [onClose]);

    const handleSave = async () => {
        setSaving(true);
        const patch: CardUpdate = {};
        if (title.trim() && title.trim() !== card.title) patch.title = title.trim();
        if (size !== card.size) {
            if (size === null) patch.clear_size = true;
            else patch.size = size;
        }
        if (notes !== (card.document_content_html ?? '')) patch.document_content_html = notes;
        if (assigneeId !== (card.assigned_person_id ?? '')) {
            if (!assigneeId) patch.clear_assignee = true;
            else patch.assigned_person_id = assigneeId;
        }
        if (dueDate !== (card.due_date ?? '')) {
            if (!dueDate) patch.clear_due_date = true;
            else patch.due_date = dueDate;
        }
        if (Object.keys(patch).length > 0) await onUpdate(card.id, patch);
        setSaving(false);
        onClose();
    };

    const handleToggleLabel = (labelId: string) => {
        const isActive = localLabelIds.includes(labelId);
        setLocalLabelIds(prev => isActive ? prev.filter(id => id !== labelId) : [...prev, labelId]);
        onToggleLabel(card.id, labelId, localLabelIds);
    };

    const handleCreateLabel = async (e: React.FormEvent) => {
        e.preventDefault();
        const name = newLabelName.trim();
        if (!name) return;
        setAddingLabel(true);
        const created = await onCreateLabel({ feature_instance_id: card.feature_instance_id, name, color: newLabelColor });
        if (created) {
            setLocalLabelIds(prev => [...prev, created.id]);
            onToggleLabel(card.id, created.id, localLabelIds);
        }
        setNewLabelName('');
        setNewLabelColor(LABEL_COLORS[0]);
        setShowNewLabel(false);
        setAddingLabel(false);
    };

    const inputStyle: React.CSSProperties = {
        width: '100%', padding: '8px 12px',
        border: `1px solid ${theme.colors.border}`, borderRadius: '8px',
        backgroundColor: theme.colors.surface, color: theme.colors.text,
        fontSize: 'var(--font-sm)', boxSizing: 'border-box',
    };

    const sectionLabel: React.CSSProperties = {
        fontSize: '11px', fontWeight: 700, color: theme.colors.secondary,
        textTransform: 'uppercase', letterSpacing: '0.06em', marginBottom: '8px',
    };

    return (
        <div
            style={{ position: 'fixed', inset: 0, backgroundColor: 'rgba(0,0,0,0.55)', display: 'flex', alignItems: 'center', justifyContent: 'center', zIndex: 200, padding: '16px' }}
            onClick={e => { if (e.target === e.currentTarget) onClose(); }}
        >
            <div style={{
                backgroundColor: theme.colors.surface,
                borderRadius: '14px',
                border: `1px solid ${theme.colors.border}`,
                width: '680px', maxWidth: '100%', maxHeight: '90vh',
                display: 'flex', flexDirection: 'column',
                boxShadow: '0 20px 60px rgba(0,0,0,0.25)',
            }}>
                {/* Header */}
                <div style={{ display: 'flex', alignItems: 'center', gap: '12px', padding: '18px 20px 14px', borderBottom: `1px solid ${theme.colors.border}` }}>
                    <input
                        value={title}
                        onChange={e => setTitle(e.target.value)}
                        disabled={!canEdit}
                        style={{ ...inputStyle, flex: 1, fontSize: 'var(--font-md)', fontWeight: 600, border: canEdit ? `1px solid ${theme.colors.border}` : 'none', background: canEdit ? theme.colors.surface : 'transparent', padding: canEdit ? '6px 10px' : '6px 0' }}
                        placeholder={t('features.kanban.addCardPlaceholder')}
                    />
                    <button onClick={onClose} style={{ background: 'none', border: 'none', cursor: 'pointer', color: theme.colors.secondary, padding: '4px', display: 'flex', alignItems: 'center', flexShrink: 0 }}>
                        <ThemedSvgIcon name="x" color={theme.colors.secondary} size={20} />
                    </button>
                </div>

                {/* Body */}
                <div style={{ flex: 1, overflowY: 'auto', padding: '18px 20px', display: 'flex', flexDirection: 'column', gap: '18px' }}>

                    {/* Labels + Assignee row */}
                    <div style={{ display: 'flex', gap: '16px', alignItems: 'flex-start' }}>
                        {/* Labels */}
                        <div style={{ flex: 1 }}>
                            <div style={sectionLabel}>{t('features.kanban.manageLabels')}</div>
                            <div style={{ display: 'flex', flexWrap: 'wrap', gap: '6px', alignItems: 'center' }}>
                                {boardLabels.map(label => {
                                    const active = localLabelIds.includes(label.id);
                                    return (
                                        <button
                                            key={label.id}
                                            onClick={() => canEdit ? handleToggleLabel(label.id) : undefined}
                                            disabled={!canEdit}
                                            style={{
                                                padding: '4px 12px', borderRadius: '12px',
                                                border: `1.5px solid ${label.color}`,
                                                background: active ? label.color : 'transparent',
                                                color: active ? theme.colors.surface : label.color,
                                                fontSize: '12px', fontWeight: 600,
                                                cursor: canEdit ? 'pointer' : 'default',
                                                transition: 'all 0.15s',
                                            }}
                                        >
                                            {label.name}
                                        </button>
                                    );
                                })}
                                {canEdit && !showNewLabel && (
                                    <button
                                        onClick={() => setShowNewLabel(true)}
                                        style={{ display: 'flex', alignItems: 'center', gap: '4px', padding: '3px 10px', borderRadius: '12px', border: `1.5px dashed ${theme.colors.border}`, background: 'none', color: theme.colors.secondary, fontSize: '12px', fontWeight: 600, cursor: 'pointer' }}
                                    >
                                        <ThemedSvgIcon name="plus" color={theme.colors.secondary} size={12} />
                                        {t('features.kanban.addLabel')}
                                    </button>
                                )}
                            </div>

                            {canEdit && showNewLabel && (
                                <form onSubmit={handleCreateLabel} style={{ display: 'flex', flexDirection: 'column', gap: '8px', marginTop: '10px', padding: '10px 12px', border: `1px solid ${theme.colors.border}`, borderRadius: '8px', backgroundColor: theme.colors.surface }}>
                                    <div style={{ display: 'flex', gap: '8px', alignItems: 'center', flexWrap: 'wrap' }}>
                                        <input
                                            autoFocus
                                            value={newLabelName}
                                            onChange={e => setNewLabelName(e.target.value)}
                                            onKeyDown={e => { if (e.key === 'Escape') { setShowNewLabel(false); setNewLabelName(''); } }}
                                            placeholder={t('features.kanban.newLabelPlaceholder')}
                                            style={{ padding: '5px 9px', border: `1px solid ${theme.colors.border}`, borderRadius: '6px', backgroundColor: theme.colors.surface, color: theme.colors.text, fontSize: 'var(--font-sm)', width: '140px' }}
                                        />
                                        <div style={{ display: 'flex', gap: '4px' }}>
                                            {LABEL_COLORS.map(c => (
                                                <button
                                                    key={c} type="button"
                                                    onClick={() => setNewLabelColor(c)}
                                                    style={{ width: '20px', height: '20px', borderRadius: '50%', background: c, border: newLabelColor === c ? `2px solid ${theme.colors.text}` : '2px solid transparent', cursor: 'pointer', padding: 0, flexShrink: 0 }}
                                                />
                                            ))}
                                        </div>
                                    </div>
                                    <div style={{ display: 'flex', gap: '6px', justifyContent: 'flex-end' }}>
                                        <ThemedButton variant="ghost" type="button" onClick={() => { setShowNewLabel(false); setNewLabelName(''); }} style={{ fontSize: 'var(--font-xs)', padding: '3px 10px' }}>{t('common.cancel')}</ThemedButton>
                                        <ThemedButton variant="primary" type="submit" disabled={!newLabelName.trim() || addingLabel} style={{ fontSize: 'var(--font-xs)', padding: '3px 10px' }}>{t('features.kanban.addLabel')}</ThemedButton>
                                    </div>
                                </form>
                            )}
                        </div>

                        {/* Assignee */}
                        {persons.length > 1 && (
                            <div style={{ flexShrink: 0 }}>
                                <div style={sectionLabel}>{t('features.kanban.assignee')}</div>
                                <select
                                    value={assigneeId}
                                    onChange={e => setAssigneeId(e.target.value)}
                                    disabled={!canEdit}
                                    style={{ ...inputStyle, width: 'auto', minWidth: '160px' }}
                                >
                                    <option value="">{t('features.kanban.noAssignee')}</option>
                                    {persons.map(p => (
                                        <option key={p.id} value={p.id}>{p.name}</option>
                                    ))}
                                </select>
                            </div>
                        )}
                    </div>

                    {/* Size + Due date row */}
                    <div style={{ display: 'flex', gap: '24px', flexWrap: 'wrap' }}>
                        {/* Fibonacci size */}
                        <div style={{ flex: '1 1 200px' }}>
                            <div style={sectionLabel}>{t('features.kanban.size')}</div>
                            <div style={{ display: 'flex', gap: '5px', flexWrap: 'wrap' }}>
                                {FIBONACCI.map(n => (
                                    <button
                                        key={n}
                                        onClick={() => canEdit ? setSize(prev => prev === n ? null : n) : undefined}
                                        disabled={!canEdit}
                                        style={{
                                            width: '36px', height: '32px',
                                            border: size === n ? `2px solid ${fibColor(n)}` : `1px solid ${theme.colors.border}`,
                                            borderRadius: '6px',
                                            background: size === n ? fibColor(n) : 'transparent',
                                            color: size === n ? theme.colors.surface : fibColor(n),
                                            fontWeight: 700, fontSize: '13px', cursor: canEdit ? 'pointer' : 'default',
                                            transition: 'all 0.15s',
                                        }}
                                    >
                                        {n}
                                    </button>
                                ))}
                            </div>
                        </div>

                        {/* Due date */}
                        <ThemedDateSelection
                            label={t('features.kanban.dueDate')}
                            value={dueDate}
                            onChange={setDueDate}
                            disabled={!canEdit}
                        />
                    </div>

                    {/* Notes */}
                    <div>
                        <div style={sectionLabel}>{t('features.kanban.notes')}</div>
                        {canEdit
                            ? <JoditEditorComponent content={notes} onChange={setNotes} minHeight={320} compact />
                            : card.document_content_html
                                ? <div className="prose max-w-none" style={{ fontSize: 'var(--font-sm)', color: theme.colors.text }} dangerouslySetInnerHTML={{ __html: card.document_content_html }} />
                                : <div style={{ fontSize: 'var(--font-sm)', color: theme.colors.secondary, fontStyle: 'italic' }}>{t('features.kanban.noDocument')}</div>
                        }
                    </div>
                </div>

                {/* Footer */}
                <div style={{ display: 'flex', justifyContent: 'flex-end', alignItems: 'center', padding: '14px 20px', borderTop: `1px solid ${theme.colors.border}`, gap: '8px' }}>
                    <ThemedButton variant="ghost" onClick={onClose} disabled={saving}>{t('common.cancel')}</ThemedButton>
                    {canEdit && (
                        <ThemedButton variant="primary" onClick={handleSave} disabled={saving || !title.trim()}>
                            {saving ? t('common.saving') : t('common.save')}
                        </ThemedButton>
                    )}
                </div>
            </div>
        </div>
    );
};

export default KanbanCardModal;
