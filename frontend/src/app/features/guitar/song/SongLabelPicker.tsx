import { ColorSwatchPicker } from '@/app/platform/core/layout/themes/components/ColorSwatchPicker.tsx';
import { ThemedButton } from '@/app/platform/core/layout/themes/components/ThemedButton.tsx';
import { ThemedInput } from '@/app/platform/core/layout/themes/components/ThemedInput.tsx';

import React, { useState } from 'react';
import { useTranslation } from 'react-i18next';

import { SongLabelChip } from './SongLabelChip.tsx';
import { GuitarSongLabel, GuitarSongLabelCreate, GuitarSongLabelUpdate } from './types.ts';

const COLOR_PALETTE = [
  '#ef4444', '#f97316', '#eab308', '#84cc16', '#22c55e', '#06b6d4',
  '#3b82f6', '#8b5cf6', '#ec4899', '#f43f5e', '#6b7280', '#10b981',
];

interface SongLabelPickerProps {
  labels: GuitarSongLabel[];
  attachedLabelIds: string[];
  canEdit: boolean;
  canManage: boolean;
  onToggle: (labelId: string) => Promise<void>;
  onCreate: (data: GuitarSongLabelCreate) => Promise<void>;
  onUpdate: (labelId: string, data: GuitarSongLabelUpdate) => Promise<void>;
  onDelete: (labelId: string) => Promise<void>;
}

export const SongLabelPicker: React.FC<SongLabelPickerProps> = ({
  labels, attachedLabelIds, canEdit, canManage, onToggle, onCreate, onUpdate, onDelete,
}) => {
  const { t } = useTranslation();
  const [newName, setNewName] = useState('');
  const [newColor, setNewColor] = useState(COLOR_PALETTE[0]);
  const [creating, setCreating] = useState(false);

  const handleCreate = async () => {
    if (!newName.trim()) return;
    setCreating(true);
    try {
      await onCreate({ name: newName.trim(), color: newColor });
      setNewName('');
    } finally {
      setCreating(false);
    }
  };

  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: '10px' }}>
      <div style={{ display: 'flex', flexWrap: 'wrap', gap: '6px' }}>
        {labels.map((label) => (
          <SongLabelChip
            key={label.id}
            label={label}
            attached={attachedLabelIds.includes(label.id)}
            clickable={canEdit}
            canManage={canManage}
            onToggle={() => onToggle(label.id)}
            onUpdate={(data) => onUpdate(label.id, data)}
            onDelete={() => onDelete(label.id)}
          />
        ))}
      </div>
      {canManage && (
        <div style={{ display: 'flex', gap: '8px', alignItems: 'center', flexWrap: 'wrap' }}>
          <ThemedInput
            value={newName}
            onChange={(e) => setNewName(e.target.value)}
            placeholder={t('guitarSong.labels.newLabelPlaceholder')}
          />
          <ColorSwatchPicker colors={COLOR_PALETTE} value={newColor} onChange={setNewColor} size={16} />
          <ThemedButton onClick={handleCreate} disabled={!newName.trim()} isLoading={creating} fullWidth={false}>
            {t('guitarSong.labels.createLabel')}
          </ThemedButton>
        </div>
      )}
    </div>
  );
};
