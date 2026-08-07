import { ThemedIconButton } from '@/app/platform/core/layout/themes/components/ThemedIconButton.tsx';
import { ThemedPopover } from '@/app/platform/core/layout/themes/components/ThemedPopover.tsx';

import React from 'react';
import { useTranslation } from 'react-i18next';

import { BlockPresentationFields } from './SongBlockPresentationFields.tsx';
import * as layoutMutations from './layoutMutations.ts';
import { GuitarSongLayoutBlock, GuitarSongLayoutRow, LAYOUT_ROW_WIDTH_EIGHTHS } from './types.ts';
import { useGuitarSong } from './useGuitarSong.ts';

interface SongBlockMenuProps {
  row: GuitarSongLayoutRow;
  columnId: string;
  blockIndex: number;
  block: GuitarSongLayoutBlock;
  hook: ReturnType<typeof useGuitarSong>;
  onOpenChange?: (open: boolean) => void;
  direction?: 'up' | 'down';
}

export const SongBlockMenu: React.FC<SongBlockMenuProps> = ({
  row, columnId, blockIndex, block, hook, onOpenChange, direction,
}) => {
  const { t } = useTranslation();
  const column = row.columns.find((c) => c.id === columnId);

  // A column must keep at least one block and a row at least one column (enforced server-side),
  // so removing a column's last block cascades to removing the column, and removing a row's
  // last column cascades to removing the whole row.
  const handleRemove = () => {
    if (column && column.blocks.length <= 1) {
      if (row.columns.length <= 1) return hook.removeLayoutRow(row.id);
      return hook.replaceLayoutRow(row.id, (latestRow) => layoutMutations.removeColumn(latestRow, columnId));
    }
    return hook.replaceLayoutRow(row.id, (latestRow) => layoutMutations.removeBlock(latestRow, columnId, blockIndex));
  };

  return (
    <ThemedPopover
      triggerIcon="maximize" triggerLabel={t('guitarSong.layout.blockMenu')} closeLabel={t('common.close')}
      triggerIconSize={12} onOpenChange={onOpenChange} direction={direction}
    >
      {(close) => (
        <div style={{ display: 'flex', flexDirection: 'column', gap: '8px', width: '160px' }}>
          <BlockPresentationFields
            row={row} columnId={columnId} columnWidthEighths={column?.width_eighths ?? LAYOUT_ROW_WIDTH_EIGHTHS}
            blockIndex={blockIndex} block={block} hook={hook} onRequestClose={close}
          />
          <ThemedIconButton action={{ icon: 'trash', label: t('guitarSong.layout.removeBlock'), onClick: handleRemove, variant: 'danger' }} />
        </div>
      )}
    </ThemedPopover>
  );
};
