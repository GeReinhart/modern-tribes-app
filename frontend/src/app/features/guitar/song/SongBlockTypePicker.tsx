import { ThemedIconButton } from '@/app/platform/core/layout/themes/components/ThemedIconButton.tsx';
import { ThemedSelect } from '@/app/platform/core/layout/themes/components/ThemedSelect.tsx';

import React, { useState } from 'react';
import { useTranslation } from 'react-i18next';

import { blockTypeLabel } from './layoutBlockOptions.ts';
import { LayoutBlockType } from './types.ts';

interface SongBlockTypePickerProps {
  options: LayoutBlockType[];
  onAdd: (blockType: LayoutBlockType) => void;
  onAddFreeText: () => void;
}

// Lets the user explicitly choose which element to add — never auto-picks one — reused by
// "add row", "add column" and "add element" since all three need the same choice.
export const SongBlockTypePicker: React.FC<SongBlockTypePickerProps> = ({ options, onAdd, onAddFreeText }) => {
  const { t } = useTranslation();
  const [pending, setPending] = useState('');

  const handleAdd = () => {
    if (!pending) return;
    onAdd(pending as LayoutBlockType);
    setPending('');
  };

  return (
    <>
      {options.length > 0 && (
        <div style={{ display: 'flex', gap: '4px', alignItems: 'flex-end' }}>
          <div style={{ flex: 1 }}>
            <ThemedSelect
              options={options.map((bt) => ({ value: bt, label: blockTypeLabel(t, bt) }))}
              value={pending}
              onChange={setPending}
              allowEmpty
              placeholder={t('guitarSong.layout.addElementPlaceholder')}
            />
          </div>
          <ThemedIconButton action={{ icon: 'plus', label: t('guitarSong.layout.addElementConfirm'), onClick: handleAdd, disabled: !pending }} />
        </div>
      )}
      <ThemedIconButton action={{ icon: 'file-text', label: t('guitarSong.layout.addCustomBlock'), onClick: onAddFreeText }} />
    </>
  );
};
