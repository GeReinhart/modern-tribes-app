import { ThemedIconButton } from '@/app/platform/core/layout/themes/components/ThemedIconButton.tsx';
import { ThemedPopover } from '@/app/platform/core/layout/themes/components/ThemedPopover.tsx';
import { ThemedText } from '@/app/platform/core/layout/themes/components/ThemedText.tsx';

import React, { useState } from 'react';
import { useTranslation } from 'react-i18next';

import { useActiveLayoutMenu } from './ActiveLayoutMenuContext.tsx';
import { SongBlockClipboardPreviewModal } from './SongBlockClipboardPreviewModal.tsx';
import { SongBlockTypePicker } from './SongBlockTypePicker.tsx';
import { unusedBlockTypes } from './layoutBlockOptions.ts';
import * as layoutMutations from './layoutMutations.ts';
import { GuitarSongDetail, GuitarSongLayoutRow, LayoutBlockType } from './types.ts';
import { useGuitarSong } from './useGuitarSong.ts';
import { useSongBlockClipboard } from './useSongBlockClipboard.ts';

interface SongAddBlockAfterMenuProps {
  rows: GuitarSongLayoutRow[];
  row: GuitarSongLayoutRow;
  columnId: string;
  blockIndex: number;
  song: GuitarSongDetail;
  hook: ReturnType<typeof useGuitarSong>;
  clipboardHook: ReturnType<typeof useSongBlockClipboard>;
  onOpenChange?: (open: boolean) => void;
  direction?: 'up' | 'down';
}

// Sits right next to SongBlockMenu (Modifier/Copier/Retirer) in a selected block's toolbar, as
// a sibling "+" popover rather than a row inside that menu -- RowActionsMenu (which
// SongBlockMenu wraps) is a flat list of one-click actions shared with the row/column menus, it
// has no notion of a nested "opens its own picker" entry.
export const SongAddBlockAfterMenu: React.FC<SongAddBlockAfterMenuProps> = ({
  rows, row, columnId, blockIndex, song, hook, clipboardHook, onOpenChange, direction,
}) => {
  const { t } = useTranslation();
  const { isForcedClosed, handleOpenChange } = useActiveLayoutMenu(`block-add-${columnId}-${blockIndex}`, onOpenChange);
  const [previewOpen, setPreviewOpen] = useState(false);
  const options = unusedBlockTypes(rows, row.id);
  const { clipboard } = clipboardHook;
  const canPasteHere = !!clipboard && clipboard.song_id === song.id;

  const handleAdd = (blockType: LayoutBlockType) =>
    hook.replaceLayoutRow(row.id, (latestRow) => layoutMutations.insertBlockAfter(latestRow, columnId, blockIndex, blockType));
  const handleAddEmpty = () =>
    hook.replaceLayoutRow(row.id, (latestRow) => layoutMutations.insertBlockAfter(latestRow, columnId, blockIndex, 'custom'));
  const handlePaste = () => {
    if (clipboard) hook.replaceLayoutRow(row.id, (latestRow) => layoutMutations.insertPastedBlockAfter(latestRow, columnId, blockIndex, clipboard));
  };

  return (
    <>
      <ThemedPopover
        key={isForcedClosed ? 'forced-closed' : 'normal'}
        triggerIcon="layers" triggerLabel={t('guitarSong.layout.addBlockAfter')} closeLabel={t('common.close')}
        triggerIconSize={14} onOpenChange={handleOpenChange} direction={direction}
      >
        <div style={{ display: 'flex', flexDirection: 'column', gap: '8px', width: '200px' }}>
          <SongBlockTypePicker
            options={options} onAdd={handleAdd} onAddFreeText={handleAddEmpty}
            freeTextLabel={t('guitarSong.layout.addEmptyBlockOption')} freeTextInDropdown
          />
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
      </ThemedPopover>
      <SongBlockClipboardPreviewModal isOpen={previewOpen} onClose={() => setPreviewOpen(false)} copied={clipboard} song={song} />
    </>
  );
};
