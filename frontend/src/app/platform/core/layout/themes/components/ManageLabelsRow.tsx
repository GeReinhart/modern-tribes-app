import { ColorSwatchPicker } from '@/app/platform/core/layout/themes/components/ColorSwatchPicker.tsx';
import { ThemedButton } from '@/app/platform/core/layout/themes/components/ThemedButton.tsx';
import { ThemedSvgIcon } from '@/app/platform/core/layout/themes/icons/ThemedSvgIcon.tsx';
import { LABEL_COLORS } from '@/app/platform/core/layout/themes/themes.ts';
import { useTheme } from '@/app/platform/core/layout/themes/ThemeContext.tsx';
import type { ManagedLabel } from './ManageLabelsPanel.tsx';

import React, { useState } from 'react';
import { useTranslation } from 'react-i18next';

interface Props {
  label: ManagedLabel;
  usageCount?: number;
  canMoveUp: boolean;
  canMoveDown: boolean;
  onMoveUp?: () => void;
  onMoveDown?: () => void;
  onUpdate: (updates: { name?: string; color?: string }) => Promise<void>;
  onDelete: () => Promise<void>;
}

export const ManageLabelsRow: React.FC<Props> = ({
  label, usageCount, canMoveUp, canMoveDown, onMoveUp, onMoveDown, onUpdate, onDelete,
}) => {
  const { t } = useTranslation();
  const { theme } = useTheme();
  const [editing, setEditing] = useState(false);
  const [confirmingDelete, setConfirmingDelete] = useState(false);
  const [name, setName] = useState(label.name);
  const [color, setColor] = useState(label.color);

  const iconButtonStyle: React.CSSProperties = {
    background: 'none', border: 'none', cursor: 'pointer', padding: '2px',
    display: 'flex', alignItems: 'center', opacity: 0.5,
  };

  const save = async () => {
    const trimmed = name.trim();
    const updates: { name?: string; color?: string } = {};
    if (trimmed && trimmed !== label.name) updates.name = trimmed;
    if (color !== label.color) updates.color = color;
    if (Object.keys(updates).length > 0) await onUpdate(updates);
    setEditing(false);
  };

  const handleDeleteClick = () => {
    if (usageCount === undefined || usageCount > 0) {
      setConfirmingDelete(true);
      return;
    }
    onDelete();
  };

  if (editing) {
    return (
      <div style={{ display: 'flex', flexDirection: 'column', gap: '6px', padding: '8px', border: `1px solid ${theme.colors.border}`, borderRadius: '8px' }}>
        <input
          autoFocus
          value={name}
          onChange={(e) => setName(e.target.value)}
          onKeyDown={(e) => {
            if (e.key === 'Enter') save();
            if (e.key === 'Escape') setEditing(false);
          }}
          style={{
            padding: '4px 8px', borderRadius: '6px', fontSize: 'var(--font-sm)',
            border: `1px solid ${theme.colors.border}`, backgroundColor: theme.colors.surface,
            color: theme.colors.text, outline: 'none',
          }}
        />
        <ColorSwatchPicker colors={LABEL_COLORS} value={color} onChange={setColor} size={18} />
        <div style={{ display: 'flex', gap: '4px' }}>
          <ThemedButton onClick={save} fullWidth={false} style={{ fontSize: 'var(--font-xs)', padding: '3px 10px' }}>
            {t('common.save')}
          </ThemedButton>
          <ThemedButton variant="ghost" onClick={() => setEditing(false)} fullWidth={false} style={{ fontSize: 'var(--font-xs)', padding: '3px 10px' }}>
            {t('common.cancel')}
          </ThemedButton>
        </div>
      </div>
    );
  }

  if (confirmingDelete) {
    return (
      <div style={{ display: 'flex', alignItems: 'center', gap: '8px', padding: '6px 8px', border: `1px solid ${theme.colors.danger}`, borderRadius: '8px' }}>
        <span style={{ fontSize: 'var(--font-xs)', color: theme.colors.text, flex: 1 }}>
          {usageCount ? t('labels.confirmDeleteInUse', { count: usageCount, name: label.name }) : t('labels.confirmDelete', { name: label.name })}
        </span>
        <ThemedButton variant="danger" onClick={onDelete} fullWidth={false} style={{ fontSize: 'var(--font-xs)', padding: '3px 10px' }}>
          {t('common.delete')}
        </ThemedButton>
        <ThemedButton variant="ghost" onClick={() => setConfirmingDelete(false)} fullWidth={false} style={{ fontSize: 'var(--font-xs)', padding: '3px 10px' }}>
          {t('common.cancel')}
        </ThemedButton>
      </div>
    );
  }

  return (
    <div style={{ display: 'flex', alignItems: 'center', gap: '6px', padding: '4px 2px' }}>
      <span style={{ width: '12px', height: '12px', borderRadius: '50%', background: label.color, flexShrink: 0 }} />
      <span style={{ flex: 1, fontSize: 'var(--font-sm)', color: theme.colors.text }}>{label.name}</span>
      {onMoveUp && (
        <button type="button" title={t('labels.moveUp')} onClick={onMoveUp} disabled={!canMoveUp} style={{ ...iconButtonStyle, opacity: canMoveUp ? 0.5 : 0.15 }}>
          <ThemedSvgIcon name="chevron-up" color={theme.colors.secondary} size={14} />
        </button>
      )}
      {onMoveDown && (
        <button type="button" title={t('labels.moveDown')} onClick={onMoveDown} disabled={!canMoveDown} style={{ ...iconButtonStyle, opacity: canMoveDown ? 0.5 : 0.15 }}>
          <ThemedSvgIcon name="chevron-down" color={theme.colors.secondary} size={14} />
        </button>
      )}
      <button type="button" title={t('labels.edit')} onClick={() => setEditing(true)} style={iconButtonStyle}>
        <ThemedSvgIcon name="pencil" color={theme.colors.secondary} size={14} />
      </button>
      <button type="button" title={t('labels.delete')} onClick={handleDeleteClick} style={iconButtonStyle}>
        <ThemedSvgIcon name="x" color={theme.colors.danger} size={14} />
      </button>
    </div>
  );
};
