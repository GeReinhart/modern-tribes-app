import { RowActionsMenu } from '@/app/platform/core/layout/themes/components/RowActionsMenu.tsx';
import { ThemedConfirmDialog } from '@/app/platform/core/layout/themes/components/ThemedConfirmDialog.tsx';
import { MenuAction } from '@/app/platform/core/layout/menu.types.ts';

import React, { useState } from 'react';
import { useTranslation } from 'react-i18next';

import { useActiveLayoutMenu } from './ActiveLayoutMenuContext.tsx';
import * as layoutMutations from './layoutMutations.ts';
import { GuitarSongLayoutRow } from './types.ts';
import { useGuitarSong } from './useGuitarSong.ts';

interface SongBlockMenuProps {
  row: GuitarSongLayoutRow;
  columnId: string;
  blockIndex: number;
  hook: ReturnType<typeof useGuitarSong>;
  onOpenChange?: (open: boolean) => void;
  direction?: 'up' | 'down';
  onEdit: () => void;
  onCopy?: () => void;
}

export const SongBlockMenu: React.FC<SongBlockMenuProps> = ({
  row, columnId, blockIndex, hook, onOpenChange, direction, onEdit, onCopy,
}) => {
  const { t } = useTranslation();
  const column = row.columns.find((c) => c.id === columnId);
  const { isForcedClosed, handleOpenChange } = useActiveLayoutMenu(`block-${columnId}-${blockIndex}`, onOpenChange);
  const [confirmRemoveOpen, setConfirmRemoveOpen] = useState(false);
  const [removing, setRemoving] = useState(false);

  // A column must keep at least one block and a row at least one column (enforced server-side),
  // so removing a column's last block cascades to removing the column, and removing a row's
  // last column cascades to removing the whole row.
  const handleConfirmRemove = async () => {
    setRemoving(true);
    try {
      if (column && column.blocks.length <= 1) {
        if (row.columns.length <= 1) {
          await hook.removeLayoutRow(row.id);
        } else {
          await hook.replaceLayoutRow(row.id, (latestRow) => layoutMutations.removeColumn(latestRow, columnId));
        }
      } else {
        await hook.replaceLayoutRow(row.id, (latestRow) => layoutMutations.removeBlock(latestRow, columnId, blockIndex));
      }
      setConfirmRemoveOpen(false);
    } finally {
      setRemoving(false);
    }
  };

  const actions: MenuAction[] = [
    { icon: 'pencil', label: t('guitarSong.layout.editBlock'), onClick: onEdit },
    ...(onCopy ? [{ icon: 'copy' as const, label: t('guitarSong.layout.copyBlock'), onClick: onCopy }] : []),
    { icon: 'trash', label: t('guitarSong.layout.removeBlock'), onClick: () => setConfirmRemoveOpen(true), variant: 'danger' },
  ];

  return (
    <>
      <RowActionsMenu
        key={isForcedClosed ? 'forced-closed' : 'normal'}
        actions={actions} triggerIcon="maximize" triggerLabel={t('guitarSong.layout.blockMenu')}
        triggerIconSize={16} onOpenChange={handleOpenChange} direction={direction}
      />
      <ThemedConfirmDialog
        isOpen={confirmRemoveOpen}
        onClose={() => setConfirmRemoveOpen(false)}
        onConfirm={handleConfirmRemove}
        title={t('guitarSong.layout.removeBlock')}
        message={t('guitarSong.layout.removeBlockConfirm')}
        variant="danger"
        isLoading={removing}
      />
    </>
  );
};
