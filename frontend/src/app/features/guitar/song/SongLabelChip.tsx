import { ColorSwatchPicker } from '@/app/platform/core/layout/themes/components/ColorSwatchPicker.tsx';
import { ThemedIconButton } from '@/app/platform/core/layout/themes/components/ThemedIconButton.tsx';
import { ThemedInput } from '@/app/platform/core/layout/themes/components/ThemedInput.tsx';
import { useTheme } from '@/app/platform/core/layout/themes/ThemeContext.tsx';

import React, { useState } from 'react';
import { useTranslation } from 'react-i18next';

import { GuitarSongLabel } from './types.ts';

const COLOR_PALETTE = [
  '#ef4444', '#f97316', '#eab308', '#84cc16', '#22c55e', '#06b6d4',
  '#3b82f6', '#8b5cf6', '#ec4899', '#f43f5e', '#6b7280', '#10b981',
];

interface SongLabelChipProps {
  label: GuitarSongLabel;
  attached: boolean;
  clickable: boolean;
  canManage: boolean;
  onToggle: () => void;
  onUpdate: (data: { name?: string; color?: string }) => Promise<void>;
  onDelete: () => Promise<void>;
  onMoveLeft?: () => void;
  onMoveRight?: () => void;
}

export const SongLabelChip: React.FC<SongLabelChipProps> = ({
  label, attached, clickable, canManage, onToggle, onUpdate, onDelete, onMoveLeft, onMoveRight,
}) => {
  const { theme } = useTheme();
  const { t } = useTranslation();
  const [editing, setEditing] = useState(false);
  const [name, setName] = useState(label.name);
  const [color, setColor] = useState(label.color);

  const save = async () => {
    const updates: { name?: string; color?: string } = {};
    if (name.trim() && name !== label.name) updates.name = name.trim();
    if (color !== label.color) updates.color = color;
    if (Object.keys(updates).length > 0) await onUpdate(updates);
    setEditing(false);
  };

  if (editing) {
    return (
      <div style={{ display: 'flex', flexDirection: 'column', gap: '6px', padding: '8px', border: `1px solid ${theme.colors.border}`, borderRadius: '8px' }}>
        <ThemedInput value={name} onChange={(e) => setName(e.target.value)} />
        <ColorSwatchPicker colors={COLOR_PALETTE} value={color} onChange={setColor} size={16} />
        <div style={{ display: 'flex', gap: '4px' }}>
          <ThemedIconButton action={{ icon: 'check', label: t('common.save'), onClick: save }} />
          <ThemedIconButton action={{ icon: 'x', label: t('common.cancel'), onClick: () => setEditing(false) }} />
        </div>
      </div>
    );
  }

  return (
    <div style={{ display: 'flex', alignItems: 'center', gap: '2px', opacity: clickable ? 1 : 0.6 }}>
      <button
        type="button"
        onClick={clickable ? onToggle : undefined}
        style={{
          padding: '3px 10px',
          borderRadius: '14px',
          fontSize: 'var(--font-xs)',
          fontWeight: attached ? 700 : 500,
          cursor: clickable ? 'pointer' : 'default',
          border: `1px solid ${label.color}`,
          backgroundColor: attached ? `${label.color}30` : 'transparent',
          color: label.color,
        }}
      >
        {label.name}
      </button>
      {canManage && (
        <>
          <ThemedIconButton
            action={{ icon: 'arrow-left', label: t('guitarSong.labels.moveLeft'), onClick: onMoveLeft, disabled: !onMoveLeft }}
          />
          <ThemedIconButton
            action={{ icon: 'arrow-right', label: t('guitarSong.labels.moveRight'), onClick: onMoveRight, disabled: !onMoveRight }}
          />
          <ThemedIconButton action={{ icon: 'pencil', label: t('common.edit'), onClick: () => setEditing(true) }} />
          <ThemedIconButton action={{ icon: 'trash', label: t('common.delete'), onClick: onDelete, variant: 'danger' }} />
        </>
      )}
    </div>
  );
};
