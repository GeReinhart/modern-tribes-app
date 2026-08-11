import { ThemedCard } from '@/app/platform/core/layout/themes/components/ThemedCard.tsx';
import { useTheme } from '@/app/platform/core/layout/themes/ThemeContext.tsx';

import React, { useState } from 'react';
import { useTranslation } from 'react-i18next';

import { SongAddBlockAfterMenu } from './SongAddBlockAfterMenu.tsx';
import { SongBlockEditorModal } from './SongBlockEditorModal.tsx';
import { SongBlockMenu } from './SongBlockMenu.tsx';
import { SongEmptyBlockPlaceholder } from './SongEmptyBlockPlaceholder.tsx';
import { SongLayoutMoveButton } from './SongLayoutMoveButton.tsx';
import { isCopyableBlockType } from './layoutBlockOptions.ts';
import * as layoutMutations from './layoutMutations.ts';
import { renderBlockContent } from './songLayoutBlockContentDispatch.tsx';
import { GuitarSongDetail, GuitarSongLayoutBlock, GuitarSongLayoutRow } from './types.ts';
import { useGuitarSong } from './useGuitarSong.ts';
import { useGuitarSongLabels } from './useGuitarSongLabels.ts';
import { buildCopiedBlock, CopyableBlockType, useSongBlockClipboard } from './useSongBlockClipboard.ts';

interface SongLayoutBlockContentProps {
  block: GuitarSongLayoutBlock;
  row: GuitarSongLayoutRow;
  rows: GuitarSongLayoutRow[];
  columnId: string;
  blockIndex: number;
  isFirstBlock: boolean;
  isLastBlock: boolean;
  openUpward: boolean;
  song: GuitarSongDetail;
  labelsHook: ReturnType<typeof useGuitarSongLabels>;
  canEdit: boolean;
  canManage: boolean;
  hook: ReturnType<typeof useGuitarSong>;
  clipboardHook: ReturnType<typeof useSongBlockClipboard>;
  showStructureOutlines?: boolean;
}

export const SongLayoutBlockContent: React.FC<SongLayoutBlockContentProps> = ({
  block, row, rows, columnId, blockIndex, isFirstBlock, isLastBlock, openUpward, song, labelsHook, canEdit, canManage, hook,
  clipboardHook, showStructureOutlines = false,
}) => {
  const themeCtx = useTheme();
  const { t } = useTranslation();
  const [menuOpen, setMenuOpen] = useState(false);
  const [editorOpen, setEditorOpen] = useState(false);

  // A title save goes through the content-PATCH endpoint, not a row replace -- a row replace
  // regenerates every column's id in the row, which (since SongLayoutColumn is keyed by
  // column.id) remounts this whole subtree and closes the edit popup out from under the user
  // mid-edit. The content endpoint updates the block in place, so no id changes and the popup
  // stays open, exactly like a custom block's or chord grid's content edits already do.
  const saveBlockTitle = (customTitle: string | null) => hook.updateLayoutBlockContent(block.id, { custom_title: customTitle });
  const moveBlock = (direction: 'prev' | 'next') =>
    hook.replaceLayoutRow(row.id, (latestRow) => layoutMutations.moveBlock(latestRow, columnId, blockIndex, direction));

  // A 'sections' block with no content yet has nothing to copy; every other copyable type
  // always has content worth copying (even a blank chord grid or custom block).
  const hasSectionsContent = block.lyrics_text !== null || block.linked_to_block_id !== null;
  const onCopy = isCopyableBlockType(block.block_type) && (block.block_type !== 'sections' || hasSectionsContent)
    ? () => clipboardHook.copyBlock(buildCopiedBlock(song.id, block, block.block_type as CopyableBlockType))
    : undefined;

  // The page always shows the block exactly as presentation/PDF will -- editing happens in the
  // popup, never inline -- so this is called with canEdit/canManage forced false regardless of
  // the viewer's real permissions, which only govern whether the edit toolbar below appears.
  const readContent = renderBlockContent(block, song, labelsHook, false, false, hook, themeCtx.theme, t, saveBlockTitle);
  if (readContent === null && !canEdit) return null;
  const content = readContent ?? <SongEmptyBlockPlaceholder blockType={block.block_type} />;

  // CSS zoom (not transform:scale) reflows the whole subtree at the block's own scale, so the
  // card border and padding scale right along with the content instead of clipping it or
  // leaving empty space around it.
  const inner = block.show_card ? <ThemedCard bordered className="p-4">{content}</ThemedCard> : content;
  const primary = themeCtx.theme.colors.primary;
  const padding =
    `${block.padding_top_mm}mm ${block.padding_right_mm}mm ${block.padding_bottom_mm}mm ${block.padding_left_mm}mm`;
  return (
    <div
      style={{
        zoom: block.zoom_percent / 100, position: 'relative', borderRadius: 'var(--radius-md)',
        border: showStructureOutlines ? `1px dotted ${themeCtx.theme.colors.border}` : 'none',
        outline: menuOpen ? `3px solid ${primary}` : 'none',
        boxShadow: menuOpen ? `0 0 0 6px ${primary}30` : 'none',
        backgroundColor: menuOpen ? `${primary}10` : 'transparent',
        padding, boxSizing: 'border-box',
        // See SongLayoutRow's identical comment -- CSS zoom on this wrapper can itself trap the
        // menu's stacking, so without this the block's own menu can paint behind unrelated
        // siblings or the fixed-position metronome.
        zIndex: menuOpen ? 1000 : undefined,
      }}
    >
      {inner}
      {canEdit && (
        <div style={{
          position: 'absolute', bottom: '-14px', left: '50%', transform: 'translateX(-50%)', zIndex: 2,
          display: 'flex', alignItems: 'center', gap: '2px',
        }}
        >
          <SongLayoutMoveButton
            icon="arrow-left" label={t('guitarSong.layout.moveBlockLeft')} onClick={() => moveBlock('prev')} disabled={isFirstBlock}
          />
          <SongBlockMenu
            row={row} columnId={columnId} blockIndex={blockIndex} hook={hook} onOpenChange={setMenuOpen}
            direction={openUpward ? 'up' : 'down'} onEdit={() => setEditorOpen(true)} onCopy={onCopy}
          />
          <SongAddBlockAfterMenu
            rows={rows} row={row} columnId={columnId} blockIndex={blockIndex} song={song} hook={hook}
            clipboardHook={clipboardHook} onOpenChange={setMenuOpen} direction={openUpward ? 'up' : 'down'}
          />
          <SongLayoutMoveButton
            icon="arrow-right" label={t('guitarSong.layout.moveBlockRight')} onClick={() => moveBlock('next')} disabled={isLastBlock}
          />
        </div>
      )}
      {editorOpen && (
        <SongBlockEditorModal
          isOpen={editorOpen} onClose={() => setEditorOpen(false)} block={block} row={row} columnId={columnId}
          blockIndex={blockIndex} song={song} labelsHook={labelsHook} canEdit={canEdit} canManage={canManage}
          hook={hook} onSaveTitle={saveBlockTitle}
        />
      )}
    </div>
  );
};
