import React, { useState } from 'react';
import { useTranslation } from 'react-i18next';
import { useTheme } from '@/contexts/ThemeContext';
import { ThemedButton } from '@/components/common/form/ThemedButton';
import { ThemedSvgIcon } from '@/components/common/icons/ThemedSvgIcon';
import { LABEL_COLORS } from '@/components/themes/themes';
import type { TaskLabelInfo } from './types';

interface Props {
    labels: TaskLabelInfo[];
    activeIds: string[];
    canEdit: boolean;
    canCreateLabel: boolean;
    featureInstanceId: string;
    onToggle: (labelId: string) => void;
    onCreateLabel: (data: { feature_instance_id: string; name: string; color: string }) => Promise<TaskLabelInfo | null>;
    onLabelCreated: (label: TaskLabelInfo) => void;
}

const TaskItemModalLabels: React.FC<Props> = ({
    labels, activeIds, canEdit, canCreateLabel, featureInstanceId,
    onToggle, onCreateLabel, onLabelCreated,
}) => {
    const { t } = useTranslation();
    const { theme } = useTheme();
    const [showNew, setShowNew] = useState(false);
    const [newName, setNewName] = useState('');
    const [newColor, setNewColor] = useState(LABEL_COLORS[0]);
    const [adding, setAdding] = useState(false);

    const handleCreate = async (e: React.FormEvent) => {
        e.preventDefault();
        const name = newName.trim();
        if (!name) return;
        setAdding(true);
        const created = await onCreateLabel({ feature_instance_id: featureInstanceId, name, color: newColor });
        if (created) onLabelCreated(created);
        setNewName('');
        setNewColor(LABEL_COLORS[0]);
        setShowNew(false);
        setAdding(false);
    };

    return (
        <div>
            <div style={{ display: 'flex', flexWrap: 'wrap', gap: '6px', alignItems: 'center' }}>
                {labels.map(label => {
                    const active = activeIds.includes(label.id);
                    return (
                        <button key={label.id} onClick={() => canEdit ? onToggle(label.id) : undefined} disabled={!canEdit}
                            style={{ padding: '4px 12px', borderRadius: '12px', border: `1.5px solid ${label.color}`, background: active ? label.color : 'transparent', color: active ? theme.colors.surface : label.color, fontSize: '12px', fontWeight: 600, cursor: canEdit ? 'pointer' : 'default', transition: 'all 0.15s' }}>
                            {label.name}
                        </button>
                    );
                })}
                {canCreateLabel && !showNew && (
                    <button onClick={() => setShowNew(true)} style={{ display: 'flex', alignItems: 'center', gap: '4px', padding: '3px 10px', borderRadius: '12px', border: `1.5px dashed ${theme.colors.border}`, background: 'none', color: theme.colors.secondary, fontSize: '12px', fontWeight: 600, cursor: 'pointer' }}>
                        <ThemedSvgIcon name="plus" color={theme.colors.secondary} size={12} />
                        {t('features.kanban.addLabel')}
                    </button>
                )}
            </div>
            {canCreateLabel && showNew && (
                <form onSubmit={handleCreate} style={{ display: 'flex', flexDirection: 'column', gap: '8px', marginTop: '10px', padding: '10px 12px', border: `1px solid ${theme.colors.border}`, borderRadius: '8px' }}>
                    <div style={{ display: 'flex', gap: '8px', alignItems: 'center', flexWrap: 'wrap' }}>
                        <input autoFocus value={newName} onChange={e => setNewName(e.target.value)}
                            onKeyDown={e => { if (e.key === 'Escape') { setShowNew(false); setNewName(''); } }}
                            placeholder={t('features.kanban.newLabelPlaceholder')}
                            style={{ padding: '5px 9px', border: `1px solid ${theme.colors.border}`, borderRadius: '6px', backgroundColor: theme.colors.surface, color: theme.colors.text, fontSize: 'var(--font-sm)', width: '140px' }} />
                        <div style={{ display: 'flex', gap: '4px' }}>
                            {LABEL_COLORS.map(c => (
                                <button key={c} type="button" onClick={() => setNewColor(c)}
                                    style={{ width: '20px', height: '20px', borderRadius: '50%', background: c, border: newColor === c ? `2px solid ${theme.colors.text}` : '2px solid transparent', cursor: 'pointer', padding: 0, flexShrink: 0 }} />
                            ))}
                        </div>
                    </div>
                    <div style={{ display: 'flex', gap: '6px', justifyContent: 'flex-end' }}>
                        <ThemedButton variant="ghost" type="button" onClick={() => { setShowNew(false); setNewName(''); }} style={{ fontSize: 'var(--font-xs)', padding: '3px 10px' }}>{t('common.cancel')}</ThemedButton>
                        <ThemedButton variant="primary" type="submit" disabled={!newName.trim() || adding} style={{ fontSize: 'var(--font-xs)', padding: '3px 10px' }}>{t('features.kanban.addLabel')}</ThemedButton>
                    </div>
                </form>
            )}
        </div>
    );
};

export default TaskItemModalLabels;
