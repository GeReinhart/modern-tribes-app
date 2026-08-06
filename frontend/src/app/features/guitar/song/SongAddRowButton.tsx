import { ThemedPopover } from '@/app/platform/core/layout/themes/components/ThemedPopover.tsx';

import React from 'react';
import { useTranslation } from 'react-i18next';

import { SongBlockTypePicker } from './SongBlockTypePicker.tsx';
import { unusedBlockTypes } from './layoutBlockOptions.ts';
import * as layoutMutations from './layoutMutations.ts';
import { GuitarSongLayoutRow, LayoutBlockType } from './types.ts';
import { useGuitarSong } from './useGuitarSong.ts';

interface SongAddRowButtonProps {
  rows: GuitarSongLayoutRow[];
  hook: ReturnType<typeof useGuitarSong>;
}

export const SongAddRowButton: React.FC<SongAddRowButtonProps> = ({ rows, hook }) => {
  const { t } = useTranslation();
  const options = unusedBlockTypes(rows, '');

  const handleAdd = (blockType: LayoutBlockType) => hook.addLayoutRow(layoutMutations.newRowInput(blockType));
  const handleAddFreeText = () => hook.addLayoutRow(layoutMutations.newRowInput('custom'));

  return (
    <ThemedPopover triggerIcon="plus" triggerLabel={t('guitarSong.layout.addRow')} closeLabel={t('common.close')}>
      <div style={{ display: 'flex', flexDirection: 'column', gap: '8px', width: '200px' }}>
        <SongBlockTypePicker options={options} onAdd={handleAdd} onAddFreeText={handleAddFreeText} />
      </div>
    </ThemedPopover>
  );
};
