import { ThemedIconButton } from '@/app/platform/core/layout/themes/components/ThemedIconButton.tsx';
import { ThemedPopover } from '@/app/platform/core/layout/themes/components/ThemedPopover.tsx';
import { ThemedText } from '@/app/platform/core/layout/themes/components/ThemedText.tsx';
import { useTheme } from '@/app/platform/core/layout/themes/ThemeContext.tsx';

import React from 'react';
import { useTranslation } from 'react-i18next';

import { SongBlockTypePicker } from './SongBlockTypePicker.tsx';
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
  const columnOptions = unusedBlockTypes(rows, row.id);

  const handleAddColumn = (blockType: LayoutBlockType) =>
    hook.replaceLayoutRow(row.id, (latestRow) => layoutMutations.addColumn(latestRow, blockType));
  const handleAddColumnFreeText = () => hook.replaceLayoutRow(row.id, (latestRow) => layoutMutations.addColumn(latestRow, 'custom'));
  const handleAddEmptyColumn = () => hook.replaceLayoutRow(row.id, (latestRow) => layoutMutations.addEmptyColumn(latestRow));
  const handleTogglePageBreak = () => hook.replaceLayoutRow(row.id, (latestRow) => layoutMutations.togglePageBreak(latestRow));
  const hasRoomForNewColumn = layoutMutations.remainingRowWidthEighths(row) >= 1;

  return (
    <ThemedPopover
      triggerIcon="list" triggerLabel={t('guitarSong.layout.rowMenu')} closeLabel={t('common.close')}
      triggerIconSize={12} onOpenChange={onOpenChange} direction={direction}
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
        <ThemedIconButton action={{ icon: 'trash', label: t('guitarSong.layout.removeRow'), onClick: () => hook.removeLayoutRow(row.id), variant: 'danger' }} />
      </div>
    </ThemedPopover>
  );
};
