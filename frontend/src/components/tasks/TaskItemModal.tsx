import React, { useState, useEffect } from 'react';
import { useTranslation } from 'react-i18next';
import { useTheme } from '@/contexts/ThemeContext';
import { ThemedButton } from '@/components/common/form/ThemedButton';
import { ThemedSvgIcon } from '@/components/common/icons/ThemedSvgIcon';
import JoditEditorComponent from '@/components/common/editor/JoditEditorComponent';
import ThemedDateSelection from '@/components/common/form/ThemedDateSelection';
import { FIBONACCI, fibColor } from '@/types/features';
import TaskItemModalLabels from './TaskItemModalLabels';
import type { TaskItemModalProps, TaskPatch, TaskLabelInfo } from './types';

const sectionLabel: React.CSSProperties = {
    fontSize: '11px', fontWeight: 700, textTransform: 'uppercase',
    letterSpacing: '0.06em', marginBottom: '8px',
};

const TaskItemModal: React.FC<TaskItemModalProps> = ({
    value, labels, persons, canEdit, canCreateLabel,
    onClose, onUpdate, onToggleLabel, onCreateLabel,
}) => {
    const { t } = useTranslation();
    const { theme } = useTheme();

    const [title, setTitle] = useState(value.title);
    const [assigneeId, setAssigneeId] = useState(value.assigned_person_id ?? '');
    const [size, setSize] = useState<number | null>(value.size);
    const [dueDate, setDueDate] = useState(value.due_date ?? '');
    const [notes, setNotes] = useState(value.document_content_html ?? '');
    const [saving, setSaving] = useState(false);
    const [localLabelIds, setLocalLabelIds] = useState<string[]>(value.label_ids);
    const [allLabels, setAllLabels] = useState<TaskLabelInfo[]>(labels);

    useEffect(() => {
        const handler = (e: KeyboardEvent) => { if (e.key === 'Escape') onClose(); };
        window.addEventListener('keydown', handler);
        return () => window.removeEventListener('keydown', handler);
    }, [onClose]);

    const inputStyle: React.CSSProperties = {
        width: '100%', padding: '8px 12px',
        border: `1px solid ${theme.colors.border}`, borderRadius: '8px',
        backgroundColor: theme.colors.surface, color: theme.colors.text,
        fontSize: 'var(--font-sm)', boxSizing: 'border-box',
    };

    const handleSave = async () => {
        setSaving(true);
        const patch: TaskPatch = {};
        if (title.trim() && title.trim() !== value.title) patch.title = title.trim();
        if (size !== value.size) { if (size === null) patch.clear_size = true; else patch.size = size; }
        if (notes !== (value.document_content_html ?? '')) patch.document_content_html = notes;
        if (assigneeId !== (value.assigned_person_id ?? '')) {
            if (!assigneeId) patch.clear_assignee = true; else patch.assigned_person_id = assigneeId;
        }
        if (dueDate !== (value.due_date ?? '')) {
            if (!dueDate) patch.clear_due_date = true; else patch.due_date = dueDate;
        }
        if (Object.keys(patch).length > 0) await onUpdate(value.id, patch);
        setSaving(false);
        onClose();
    };

    const handleToggle = (labelId: string) => {
        setLocalLabelIds(prev => prev.includes(labelId) ? prev.filter(id => id !== labelId) : [...prev, labelId]);
        onToggleLabel(value.id, labelId, localLabelIds);
    };

    const handleLabelCreated = (label: TaskLabelInfo) => {
        setAllLabels(prev => [...prev, label]);
        setLocalLabelIds(prev => [...prev, label.id]);
        onToggleLabel(value.id, label.id, localLabelIds);
    };

    return (
        <div style={{ position: 'fixed', inset: 0, backgroundColor: 'rgba(0,0,0,0.55)', display: 'flex', alignItems: 'center', justifyContent: 'center', zIndex: 300, padding: '16px' }}
            onClick={e => { if (e.target === e.currentTarget) onClose(); }}>
            <div style={{ backgroundColor: theme.colors.surface, borderRadius: '14px', border: `1px solid ${theme.colors.border}`, width: '680px', maxWidth: '100%', maxHeight: '90vh', display: 'flex', flexDirection: 'column', boxShadow: '0 20px 60px rgba(0,0,0,0.25)' }}>
                <div style={{ display: 'flex', alignItems: 'center', gap: '12px', padding: '18px 20px 14px', borderBottom: `1px solid ${theme.colors.border}` }}>
                    <input value={title} onChange={e => setTitle(e.target.value)} disabled={!canEdit}
                        style={{ ...inputStyle, flex: 1, fontSize: 'var(--font-md)', fontWeight: 600, border: canEdit ? `1px solid ${theme.colors.border}` : 'none', background: canEdit ? theme.colors.surface : 'transparent', padding: canEdit ? '6px 10px' : '6px 0' }}
                        placeholder={t('features.kanban.addCardPlaceholder')} />
                    <button onClick={onClose} style={{ background: 'none', border: 'none', cursor: 'pointer', padding: '4px', display: 'flex', alignItems: 'center', flexShrink: 0 }}>
                        <ThemedSvgIcon name="x" color={theme.colors.secondary} size={20} />
                    </button>
                </div>
                <div style={{ flex: 1, overflowY: 'auto', padding: '18px 20px', display: 'flex', flexDirection: 'column', gap: '18px' }}>
                    <div style={{ display: 'flex', gap: '16px', alignItems: 'flex-start' }}>
                        <div style={{ flex: 1 }}>
                            <div style={{ ...sectionLabel, color: theme.colors.secondary }}>{t('features.kanban.manageLabels')}</div>
                            <TaskItemModalLabels labels={allLabels} activeIds={localLabelIds} canEdit={canEdit}
                                canCreateLabel={canCreateLabel} featureInstanceId={value.feature_instance_id}
                                onToggle={handleToggle} onCreateLabel={onCreateLabel} onLabelCreated={handleLabelCreated} />
                        </div>
                        {persons.length > 0 && (
                            <div style={{ flexShrink: 0 }}>
                                <div style={{ ...sectionLabel, color: theme.colors.secondary }}>{t('features.kanban.assignee')}</div>
                                <select value={assigneeId} onChange={e => setAssigneeId(e.target.value)} disabled={!canEdit}
                                    style={{ ...inputStyle, width: 'auto', minWidth: '160px' }}>
                                    <option value="">{t('features.kanban.noAssignee')}</option>
                                    {persons.map(p => <option key={p.id} value={p.id}>{p.name}</option>)}
                                </select>
                            </div>
                        )}
                    </div>
                    <div style={{ display: 'flex', gap: '24px', flexWrap: 'wrap' }}>
                        <div style={{ flex: '1 1 200px' }}>
                            <div style={{ ...sectionLabel, color: theme.colors.secondary }}>{t('features.kanban.size')}</div>
                            <div style={{ display: 'flex', gap: '5px', flexWrap: 'wrap' }}>
                                {FIBONACCI.map(n => (
                                    <button key={n} onClick={() => canEdit ? setSize(prev => prev === n ? null : n) : undefined} disabled={!canEdit}
                                        style={{ width: '36px', height: '32px', border: size === n ? `2px solid ${fibColor(n)}` : `1px solid ${theme.colors.border}`, borderRadius: '6px', background: size === n ? fibColor(n) : 'transparent', color: size === n ? theme.colors.surface : fibColor(n), fontWeight: 700, fontSize: '13px', cursor: canEdit ? 'pointer' : 'default', transition: 'all 0.15s' }}>
                                        {n}
                                    </button>
                                ))}
                            </div>
                        </div>
                        <ThemedDateSelection label={t('features.kanban.dueDate')} value={dueDate} onChange={setDueDate} disabled={!canEdit} />
                    </div>
                    <div>
                        <div style={{ ...sectionLabel, color: theme.colors.secondary }}>{t('features.kanban.notes')}</div>
                        {canEdit
                            ? <JoditEditorComponent content={notes} onChange={setNotes} minHeight={320} compact />
                            : value.document_content_html
                                ? <div className="prose max-w-none" style={{ fontSize: 'var(--font-sm)', color: theme.colors.text }} dangerouslySetInnerHTML={{ __html: value.document_content_html }} />
                                : <div style={{ fontSize: 'var(--font-sm)', color: theme.colors.secondary, fontStyle: 'italic' }}>{t('features.kanban.noDocument')}</div>
                        }
                    </div>
                </div>
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

export default TaskItemModal;
