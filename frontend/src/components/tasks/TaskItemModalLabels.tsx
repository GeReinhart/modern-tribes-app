import React, { useState, useRef } from 'react';
import { useTranslation } from 'react-i18next';
import { useTheme } from '@/contexts/ThemeContext';
import { ThemedButton } from '@/components/common/form/ThemedButton';
import { ThemedSvgIcon } from '@/components/common/icons/ThemedSvgIcon';
import { LABEL_COLORS } from '@/components/themes/themes';
import { useSystemLabelSearch } from './useSystemLabelSearch';
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

const LabelSuggestions: React.FC<{
    suggestions: TaskLabelInfo[];
    onSelect: (label: TaskLabelInfo) => void;
    borderColor: string;
    surfaceColor: string;
    textColor: string;
}> = ({ suggestions, onSelect, borderColor, surfaceColor, textColor }) => (
    <div style={{ position: 'absolute', top: '100%', left: 0, zIndex: 50, marginTop: '2px', background: surfaceColor, border: `1px solid ${borderColor}`, borderRadius: '6px', boxShadow: '0 4px 12px rgba(0,0,0,0.12)', minWidth: '160px', maxHeight: '160px', overflowY: 'auto' }}>
        {suggestions.map(label => (
            <button key={label.id} type="button" onMouseDown={e => { e.preventDefault(); onSelect(label); }}
                style={{ display: 'flex', alignItems: 'center', gap: '8px', width: '100%', padding: '6px 10px', background: 'none', border: 'none', cursor: 'pointer', textAlign: 'left', color: textColor, fontSize: '13px' }}>
                <span style={{ width: '10px', height: '10px', borderRadius: '50%', background: label.color, flexShrink: 0 }} />
                {label.name}
            </button>
        ))}
    </div>
);

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
    const [inputFocused, setInputFocused] = useState(false);
    const inputRef = useRef<HTMLInputElement>(null);

    const systemSuggestions = useSystemLabelSearch(newName);
    const suggestions = systemSuggestions.filter(l => !activeIds.includes(l.id));
    const showSuggestions = inputFocused && suggestions.length > 0;

    const resetForm = () => { setShowNew(false); setNewName(''); setNewColor(LABEL_COLORS[0]); };

    const handleSelectSuggestion = (suggestion: TaskLabelInfo) => {
        const existingInFeature = labels.find(l => l.id === suggestion.id);
        if (existingInFeature) {
            onToggle(existingInFeature.id);
            resetForm();
        } else {
            setNewName(suggestion.name);
            setNewColor(suggestion.color);
        }
    };

    const handleCreate = async (e: React.FormEvent) => {
        e.preventDefault();
        const name = newName.trim();
        if (!name) return;
        setAdding(true);
        const created = await onCreateLabel({ feature_instance_id: featureInstanceId, name, color: newColor });
        if (created) onLabelCreated(created);
        resetForm();
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
                    <button onClick={() => { setShowNew(true); setTimeout(() => inputRef.current?.focus(), 0); }}
                        style={{ display: 'flex', alignItems: 'center', gap: '4px', padding: '3px 10px', borderRadius: '12px', border: `1.5px dashed ${theme.colors.border}`, background: 'none', color: theme.colors.secondary, fontSize: '12px', fontWeight: 600, cursor: 'pointer' }}>
                        <ThemedSvgIcon name="plus" color={theme.colors.secondary} size={12} />
                        {t('features.kanban.addLabel')}
                    </button>
                )}
            </div>
            {canCreateLabel && showNew && (
                <form onSubmit={handleCreate} style={{ display: 'flex', flexDirection: 'column', gap: '8px', marginTop: '10px', padding: '10px 12px', border: `1px solid ${theme.colors.border}`, borderRadius: '8px' }}>
                    <div style={{ display: 'flex', gap: '8px', alignItems: 'center', flexWrap: 'wrap' }}>
                        <div style={{ position: 'relative' }}>
                            <input ref={inputRef} value={newName} onChange={e => setNewName(e.target.value)}
                                onFocus={() => setInputFocused(true)}
                                onBlur={() => setInputFocused(false)}
                                onKeyDown={e => { if (e.key === 'Escape') resetForm(); }}
                                placeholder={t('features.kanban.newLabelPlaceholder')}
                                style={{ padding: '5px 9px', border: `1px solid ${theme.colors.border}`, borderRadius: '6px', backgroundColor: theme.colors.surface, color: theme.colors.text, fontSize: 'var(--font-sm)', width: '140px' }} />
                            {showSuggestions && (
                                <LabelSuggestions suggestions={suggestions} onSelect={handleSelectSuggestion}
                                    borderColor={theme.colors.border} surfaceColor={theme.colors.surface} textColor={theme.colors.text} />
                            )}
                        </div>
                        <div style={{ display: 'flex', gap: '4px' }}>
                            {LABEL_COLORS.map(c => (
                                <button key={c} type="button" onClick={() => setNewColor(c)}
                                    style={{ width: '20px', height: '20px', borderRadius: '50%', background: c, border: newColor === c ? `2px solid ${theme.colors.text}` : '2px solid transparent', cursor: 'pointer', padding: 0, flexShrink: 0 }} />
                            ))}
                        </div>
                    </div>
                    <div style={{ display: 'flex', gap: '6px', justifyContent: 'flex-end' }}>
                        <ThemedButton variant="ghost" type="button" onClick={resetForm} style={{ fontSize: 'var(--font-xs)', padding: '3px 10px' }}>{t('common.cancel')}</ThemedButton>
                        <ThemedButton variant="primary" type="submit" disabled={!newName.trim() || adding} style={{ fontSize: 'var(--font-xs)', padding: '3px 10px' }}>{t('features.kanban.addLabel')}</ThemedButton>
                    </div>
                </form>
            )}
        </div>
    );
};

export default TaskItemModalLabels;
