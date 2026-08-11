import { ThemedIconButton } from '@/app/platform/core/layout/themes/components/ThemedIconButton.tsx';
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
  // When set, the new row is inserted immediately before this row instead of appended at the
  // end -- lets a "+" sit between two existing rows, not just after the very last one.
  insertBeforeRowId?: string;
}

export const SongAddRowButton: React.FC<SongAddRowButtonProps> = ({ rows, hook, insertBeforeRowId }) => {
  const { t } = useTranslation();
  const options = unusedBlockTypes(rows, '');
  const triggerLabel = insertBeforeRowId ? t('guitarSong.layout.insertRowHere') : t('guitarSong.layout.addRow');

  const handleAdd = (blockType: LayoutBlockType) =>
    hook.addLayoutRow(layoutMutations.newRowInput(blockType), insertBeforeRowId);
  const handleAddFreeText = () => hook.addLayoutRow(layoutMutations.newRowInput('custom'), insertBeforeRowId);
  const handleAddEmptyRow = () => hook.addLayoutRow(layoutMutations.newEmptyRowInput(), insertBeforeRowId);

  return (
    <ThemedPopover
      triggerIcon="layers" triggerLabel={triggerLabel} closeLabel={t('common.close')}
      triggerIconSize={insertBeforeRowId ? 12 : 14}
    >
      <div style={{ display: 'flex', flexDirection: 'column', gap: '8px', width: '200px' }}>
        <SongBlockTypePicker options={options} onAdd={handleAdd} onAddFreeText={handleAddFreeText} />
        <ThemedIconButton action={{ icon: 'layout', label: t('guitarSong.layout.addEmptyRow'), onClick: handleAddEmptyRow }} />
      </div>
    </ThemedPopover>
  );
};
