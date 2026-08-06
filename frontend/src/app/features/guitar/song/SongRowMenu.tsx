import { ThemedConfirmDialog } from '@/app/platform/core/layout/themes/components/ThemedConfirmDialog.tsx';
import { ThemedIconButton } from '@/app/platform/core/layout/themes/components/ThemedIconButton.tsx';
import { ThemedPopover } from '@/app/platform/core/layout/themes/components/ThemedPopover.tsx';
import { ThemedText } from '@/app/platform/core/layout/themes/components/ThemedText.tsx';
import { useTheme } from '@/app/platform/core/layout/themes/ThemeContext.tsx';

import React, { useState } from 'react';
import { useTranslation } from 'react-i18next';

import { SongBlockTypePicker } from './SongBlockTypePicker.tsx';
import { useActiveLayoutMenu } from './ActiveLayoutMenuContext.tsx';
import { unusedBlockTypes } from './layoutBlockOptions.ts';
import * as layoutMutations from './layoutMutations.ts';
import { GuitarSongLayoutRow, LayoutBlockType } from './types.ts';
import { useGuitarSong } from './useGuitarSong.ts';

interface SongRowMenuProps {
  rows: GuitarSongLayoutRow[];
  row: GuitarSongLayoutRow;
  hook: ReturnType<typeof useGuitarSong>;
  onOpenChange?: (open: boolean) => void;
  direction?: 'up' | 'down';
}

export const SongRowMenu: React.FC<SongRowMenuProps> = ({ rows, row, hook, onOpenChange, direction }) => {
  const { t } = useTranslation();
  const { theme } = useTheme();
  const { isForcedClosed, handleOpenChange } = useActiveLayoutMenu(`row-${row.id}`, onOpenChange);
  const columnOptions = unusedBlockTypes(rows, row.id);
  const [confirmRemoveOpen, setConfirmRemoveOpen] = useState(false);
  const [removing, setRemoving] = useState(false);

  const handleAddColumn = (blockType: LayoutBlockType) =>
    hook.replaceLayoutRow(row.id, (latestRow) => layoutMutations.addColumn(latestRow, blockType));
  const handleAddColumnFreeText = () => hook.replaceLayoutRow(row.id, (latestRow) => layoutMutations.addColumn(latestRow, 'custom'));
  const handleAddEmptyColumn = () => hook.replaceLayoutRow(row.id, (latestRow) => layoutMutations.addEmptyColumn(latestRow));
  const handleTogglePageBreak = () => hook.replaceLayoutRow(row.id, (latestRow) => layoutMutations.togglePageBreak(latestRow));
  const hasRoomForNewColumn = layoutMutations.remainingRowWidthTwelfths(row) >= 1;

  const handleConfirmRemove = async () => {
    setRemoving(true);
    try {
      await hook.removeLayoutRow(row.id);
      setConfirmRemoveOpen(false);
    } finally {
      setRemoving(false);
    }
  };

  return (
    <>
      <ThemedPopover
        key={isForcedClosed ? 'forced-closed' : 'normal'}
        triggerIcon="list" triggerLabel={t('guitarSong.layout.rowMenu')} closeLabel={t('common.close')}
        triggerIconSize={16} onOpenChange={handleOpenChange} direction={direction}
      >
        <div style={{ display: 'flex', flexDirection: 'column', gap: '8px', width: '200px' }}>
          {hasRoomForNewColumn ? (
            <>
              <SongBlockTypePicker options={columnOptions} onAdd={handleAddColumn} onAddFreeText={handleAddColumnFreeText} />
              <ThemedIconButton
                action={{ icon: 'layout', label: t('guitarSong.layout.addEmptyColumn'), onClick: handleAddEmptyColumn }}
              />
            </>
          ) : (
            <ThemedText size="small">{t('guitarSong.layout.noRoomForNewColumn')}</ThemedText>
          )}
          <div style={{ backgroundColor: row.page_break_before ? `${theme.colors.primary}25` : 'transparent', borderRadius: 'var(--radius-md)' }}>
            <ThemedIconButton action={{ icon: 'flag', label: t('guitarSong.layout.pageBreakBefore'), onClick: handleTogglePageBreak }} />
          </div>
          <ThemedIconButton
            action={{ icon: 'trash', label: t('guitarSong.layout.removeRow'), onClick: () => setConfirmRemoveOpen(true), variant: 'danger' }}
          />
        </div>
      </ThemedPopover>
      <ThemedConfirmDialog
        isOpen={confirmRemoveOpen}
        onClose={() => setConfirmRemoveOpen(false)}
        onConfirm={handleConfirmRemove}
        title={t('guitarSong.layout.removeRow')}
        message={t('guitarSong.layout.removeRowConfirm')}
        variant="danger"
        isLoading={removing}
      />
    </>
  );
};
