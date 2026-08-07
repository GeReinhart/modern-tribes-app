import { ThemedIconButton } from '@/app/platform/core/layout/themes/components/ThemedIconButton.tsx';
import { ThemedPopover } from '@/app/platform/core/layout/themes/components/ThemedPopover.tsx';
import { ThemedText } from '@/app/platform/core/layout/themes/components/ThemedText.tsx';
import { useTheme } from '@/app/platform/core/layout/themes/ThemeContext.tsx';

import React from 'react';
import { useTranslation } from 'react-i18next';

import { ColumnPresentationFields } from './SongBlockPresentationFields.tsx';
import { SongBlockTypePicker } from './SongBlockTypePicker.tsx';
import { unusedBlockTypes } from './layoutBlockOptions.ts';
import * as layoutMutations from './layoutMutations.ts';
import { GuitarSongLayoutColumn, GuitarSongLayoutRow, LayoutBlockType } from './types.ts';
import { useGuitarSong } from './useGuitarSong.ts';

interface SongColumnMenuProps {
  rows: GuitarSongLayoutRow[];
  row: GuitarSongLayoutRow;
  column: GuitarSongLayoutColumn;
  hook: ReturnType<typeof useGuitarSong>;
  onOpenChange?: (open: boolean) => void;
  direction?: 'up' | 'down';
}

export const SongColumnMenu: React.FC<SongColumnMenuProps> = ({ rows, row, column, hook, onOpenChange, direction }) => {
  const { t } = useTranslation();
  const { theme } = useTheme();
  // Same set either way — uniqueness is scoped to the whole row (and, by convention, the layout).
  const options = unusedBlockTypes(rows, row.id);

  const handleAddElement = (blockType: LayoutBlockType) =>
    hook.replaceLayoutRow(row.id, (latestRow) => layoutMutations.addBlock(latestRow, column.id, blockType));
  const handleAddFreeText = () =>
    hook.replaceLayoutRow(row.id, (latestRow) => layoutMutations.addBlock(latestRow, column.id, 'custom'));
  const handleAddColumn = (blockType: LayoutBlockType) =>
    hook.replaceLayoutRow(row.id, (latestRow) => layoutMutations.addColumn(latestRow, blockType));
  const handleAddColumnFreeText = () => hook.replaceLayoutRow(row.id, (latestRow) => layoutMutations.addColumn(latestRow, 'custom'));
  const handleAddEmptyColumn = () => hook.replaceLayoutRow(row.id, (latestRow) => layoutMutations.addEmptyColumn(latestRow));
  const handleRemoveColumn = () => hook.replaceLayoutRow(row.id, (latestRow) => layoutMutations.removeColumn(latestRow, column.id));
  const hasRoomForNewColumn = layoutMutations.remainingRowWidthEighths(row) >= 1;

  const sectionStyle = { borderTop: `1px solid ${theme.colors.border}`, paddingTop: '8px', display: 'flex', flexDirection: 'column' as const, gap: '8px' };

  return (
    <ThemedPopover
      triggerIcon="columns" triggerLabel={t('guitarSong.layout.columnMenu')} closeLabel={t('common.close')}
      triggerIconSize={12} onOpenChange={onOpenChange} direction={direction}
    >
      {(close) => (
        <div style={{ display: 'flex', gap: '16px', width: '380px' }}>
          <div style={{ display: 'flex', flexDirection: 'column', gap: '8px', flex: 1 }}>
            <ThemedText size="small">{t('guitarSong.layout.columnPresentation')}</ThemedText>
            <ColumnPresentationFields row={row} column={column} hook={hook} onRequestClose={close} />
          </div>
          <div style={{ display: 'flex', flexDirection: 'column', gap: '8px', flex: 1 }}>
            <div style={sectionStyle}>
              <ThemedText size="small">{t('guitarSong.layout.addToThisColumn')}</ThemedText>
              <SongBlockTypePicker options={options} onAdd={handleAddElement} onAddFreeText={handleAddFreeText} />
            </div>
            <div style={sectionStyle}>
              <ThemedText size="small">{t('guitarSong.layout.addNewColumn')}</ThemedText>
              {hasRoomForNewColumn ? (
                <>
                  <SongBlockTypePicker options={options} onAdd={handleAddColumn} onAddFreeText={handleAddColumnFreeText} />
                  <ThemedIconButton
                    action={{ icon: 'layout', label: t('guitarSong.layout.addEmptyColumn'), onClick: handleAddEmptyColumn }}
                  />
                </>
              ) : (
                <ThemedText size="small">{t('guitarSong.layout.noRoomForNewColumn')}</ThemedText>
              )}
            </div>
            {row.columns.length > 1 && (
              <ThemedIconButton action={{ icon: 'trash', label: t('guitarSong.layout.removeColumn'), onClick: handleRemoveColumn, variant: 'danger' }} />
            )}
          </div>
        </div>
      )}
    </ThemedPopover>
  );
};
