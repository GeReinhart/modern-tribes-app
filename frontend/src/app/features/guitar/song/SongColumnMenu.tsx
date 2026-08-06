import { ThemedIconButton } from '@/app/platform/core/layout/themes/components/ThemedIconButton.tsx';
import { ThemedPopover } from '@/app/platform/core/layout/themes/components/ThemedPopover.tsx';
import { ThemedText } from '@/app/platform/core/layout/themes/components/ThemedText.tsx';
import { useTheme } from '@/app/platform/core/layout/themes/ThemeContext.tsx';

import React, { useState } from 'react';
import { useTranslation } from 'react-i18next';

import { useActiveLayoutMenu } from './ActiveLayoutMenuContext.tsx';
import { SongBlockClipboardPreviewModal } from './SongBlockClipboardPreviewModal.tsx';
import { ColumnPresentationFields } from './SongBlockPresentationFields.tsx';
import { SongBlockTypePicker } from './SongBlockTypePicker.tsx';
import { unusedBlockTypes } from './layoutBlockOptions.ts';
import * as layoutMutations from './layoutMutations.ts';
import { GuitarSongDetail, GuitarSongLayoutColumn, GuitarSongLayoutRow, LayoutBlockType } from './types.ts';
import { useGuitarSong } from './useGuitarSong.ts';
import { useSongBlockClipboard } from './useSongBlockClipboard.ts';

interface SongColumnMenuProps {
  rows: GuitarSongLayoutRow[];
  row: GuitarSongLayoutRow;
  column: GuitarSongLayoutColumn;
  song: GuitarSongDetail;
  hook: ReturnType<typeof useGuitarSong>;
  clipboardHook: ReturnType<typeof useSongBlockClipboard>;
  onOpenChange?: (open: boolean) => void;
  direction?: 'up' | 'down';
}

export const SongColumnMenu: React.FC<SongColumnMenuProps> = ({
  rows, row, column, song, hook, clipboardHook, onOpenChange, direction,
}) => {
  const { t } = useTranslation();
  const { theme } = useTheme();
  // row.id + the column's own position, NOT column.id: replace_row gives every column in the
  // row a brand new id on ANY edit, even a padding tweak from this very popover -- keying the
  // active-menu id on column.id made every such edit look like some OTHER menu had just
  // opened, force-closing this one via the key={isForcedClosed ? ...} remount below.
  const { isForcedClosed, handleOpenChange } = useActiveLayoutMenu(`column-${row.id}-${column.position}`, onOpenChange);
  const [previewOpen, setPreviewOpen] = useState(false);
  // Same set either way — uniqueness is scoped to the whole row (and, by convention, the layout).
  const options = unusedBlockTypes(rows, row.id);
  const { clipboard } = clipboardHook;
  const canPasteHere = !!clipboard && clipboard.song_id === song.id;

  const handleAddElement = (blockType: LayoutBlockType) =>
    hook.replaceLayoutRow(row.id, (latestRow) => layoutMutations.addBlock(latestRow, column.id, blockType));
  const handleAddFreeText = () =>
    hook.replaceLayoutRow(row.id, (latestRow) => layoutMutations.addBlock(latestRow, column.id, 'custom'));
  const handleAddColumn = (blockType: LayoutBlockType) =>
    hook.replaceLayoutRow(row.id, (latestRow) => layoutMutations.addColumn(latestRow, blockType));
  const handleAddColumnFreeText = () => hook.replaceLayoutRow(row.id, (latestRow) => layoutMutations.addColumn(latestRow, 'custom'));
  const handleAddEmptyColumn = () => hook.replaceLayoutRow(row.id, (latestRow) => layoutMutations.addEmptyColumn(latestRow));
  const handleRemoveColumn = () => hook.replaceLayoutRow(row.id, (latestRow) => layoutMutations.removeColumn(latestRow, column.id));
  const handlePaste = () => { if (clipboard) hook.pasteBlock(row.id, column.id, clipboard); };
  const handlePasteToNewColumn = () => { if (clipboard) hook.pasteBlockToNewColumn(row.id, clipboard); };
  const hasRoomForNewColumn = layoutMutations.remainingRowWidthTwelfths(row) >= 1;

  const sectionStyle = { display: 'flex', flexDirection: 'column' as const, gap: '8px' };
  const dividerStyle = { borderLeft: `1px solid ${theme.colors.border}`, paddingLeft: '8px' };

  return (
    <>
      <ThemedPopover
        key={isForcedClosed ? 'forced-closed' : 'normal'}
        triggerIcon="columns" triggerLabel={t('guitarSong.layout.columnMenu')} closeLabel={t('common.close')}
        triggerIconSize={16} onOpenChange={handleOpenChange} direction={direction}
      >
        <div style={{ display: 'flex', gap: '16px', width: '620px' }}>
          <div style={{ display: 'flex', flexDirection: 'column', gap: '8px', flex: '1.3' }}>
            <ThemedText size="small">{t('guitarSong.layout.columnPresentation')}</ThemedText>
            <ColumnPresentationFields row={row} column={column} hook={hook} />
          </div>
          <div style={{ display: 'flex', flexDirection: 'column', gap: '8px', flex: 1, ...dividerStyle }}>
            <ThemedText size="small">{t('guitarSong.layout.addToThisColumn')}</ThemedText>
            <SongBlockTypePicker options={options} onAdd={handleAddElement} onAddFreeText={handleAddFreeText} />
            {clipboard && (
              <div style={{ display: 'flex', gap: '4px', alignItems: 'center', flexWrap: 'wrap' }}>
                <ThemedIconButton
                  action={{ icon: 'eye', label: t('guitarSong.layout.previewClipboard'), onClick: () => setPreviewOpen(true) }}
                />
                <ThemedIconButton
                  action={{
                    icon: 'clipboard', label: t('guitarSong.layout.pasteBlock'), onClick: handlePaste, disabled: !canPasteHere,
                  }}
                />
                {!canPasteHere && <ThemedText size="small">{t('guitarSong.layout.pasteOtherSong')}</ThemedText>}
              </div>
            )}
          </div>
          <div style={{ display: 'flex', flexDirection: 'column', gap: '8px', flex: 1, ...dividerStyle }}>
            <div style={sectionStyle}>
              <ThemedText size="small">{t('guitarSong.layout.addNewColumn')}</ThemedText>
              {hasRoomForNewColumn ? (
                <>
                  <SongBlockTypePicker options={options} onAdd={handleAddColumn} onAddFreeText={handleAddColumnFreeText} />
                  <ThemedIconButton
                    action={{ icon: 'layout', label: t('guitarSong.layout.addEmptyColumn'), onClick: handleAddEmptyColumn }}
                  />
                  {clipboard && (
                    <ThemedIconButton
                      action={{
                        icon: 'clipboard', label: t('guitarSong.layout.pasteToNewColumn'),
                        onClick: handlePasteToNewColumn, disabled: !canPasteHere,
                      }}
                    />
                  )}
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
      </ThemedPopover>
      <SongBlockClipboardPreviewModal isOpen={previewOpen} onClose={() => setPreviewOpen(false)} copied={clipboard} song={song} />
    </>
  );
};
