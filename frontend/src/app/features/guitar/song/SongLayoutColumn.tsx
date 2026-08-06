import { useTheme } from '@/app/platform/core/layout/themes/ThemeContext.tsx';

import React, { useState } from 'react';
import { useTranslation } from 'react-i18next';

import { SongColumnMenu } from './SongColumnMenu.tsx';
import { SongLayoutMoveButton } from './SongLayoutMoveButton.tsx';
import { SongLayoutBlockContent } from './SongLayoutBlockContent.tsx';
import { isCompactBlockType } from './layoutBlockOptions.ts';
import * as layoutMutations from './layoutMutations.ts';
import {
  GuitarSongDetail, GuitarSongLayoutBlock, GuitarSongLayoutColumn as LayoutColumn, GuitarSongLayoutRow, LayoutAlign,
  LAYOUT_ROW_WIDTH_TWELFTHS,
} from './types.ts';
import { useGuitarSong } from './useGuitarSong.ts';
import { useGuitarSongLabels } from './useGuitarSongLabels.ts';
import { useSongBlockClipboard } from './useSongBlockClipboard.ts';

interface SongLayoutColumnProps {
  column: LayoutColumn;
  row: GuitarSongLayoutRow;
  rows: GuitarSongLayoutRow[];
  isLastRow: boolean;
  isFirstColumn: boolean;
  isLastColumn: boolean;
  song: GuitarSongDetail;
  labelsHook: ReturnType<typeof useGuitarSongLabels>;
  canEdit: boolean;
  canManage: boolean;
  hook: ReturnType<typeof useGuitarSong>;
  clipboardHook: ReturnType<typeof useSongBlockClipboard>;
  showStructureOutlines?: boolean;
}

// A block's width_twelfths is on the same 0-12 scale as a row's columns — "3/12" means roughly
// 3/12 of the page, not 3/12 of whatever column it happens to sit in. CSS flex-basis percentages
// resolve against the column though, so this rescales the block's row-relative fraction into a
// column-relative one before handing it to flexBasis.
// text-align has no effect on flex items, only on inline content -- the blocks below are laid
// out as a flex row, so the column's align setting has to translate to justify-content instead.
const ALIGN_TO_JUSTIFY_CONTENT: Record<LayoutAlign, 'flex-start' | 'center' | 'flex-end'> = {
  left: 'flex-start', center: 'center', right: 'flex-end',
};

const blockFlexBasis = (block: GuitarSongLayoutBlock, columnWidthTwelfths: number): string => {
  if (block.width_twelfths < LAYOUT_ROW_WIDTH_TWELFTHS) {
    const percentOfColumn = Math.min(100, (block.width_twelfths / columnWidthTwelfths) * 100);
    return `${percentOfColumn}%`;
  }
  if (isCompactBlockType(block.block_type)) return 'auto';
  return '100%';
};

export const SongLayoutColumn: React.FC<SongLayoutColumnProps> = ({
  column, row, rows, isLastRow, isFirstColumn, isLastColumn, song, labelsHook, canEdit, canManage, hook, clipboardHook,
  showStructureOutlines = false,
}) => {
  const { t } = useTranslation();
  const { theme } = useTheme();
  const [menuOpen, setMenuOpen] = useState(false);
  const widthPercent = (column.width_twelfths / LAYOUT_ROW_WIDTH_TWELFTHS) * 100;
  const padding = `${column.padding_top_mm}mm ${column.padding_right_mm}mm ${column.padding_bottom_mm}mm ${column.padding_left_mm}mm`;
  const moveColumn = (direction: 'prev' | 'next') =>
    hook.replaceLayoutRow(row.id, (latestRow) => layoutMutations.moveColumn(latestRow, column.id, direction));
  const resizeColumn = (deltaTwelfths: number) =>
    hook.replaceLayoutRow(row.id, (latestRow) => layoutMutations.resizeColumnWidth(latestRow, column.id, deltaTwelfths));
  const showOutline = canEdit || showStructureOutlines;

  return (
    <div
      style={{
        width: `${widthPercent}%`, minWidth: 0, textAlign: column.align, padding, boxSizing: 'border-box', position: 'relative',
        borderRadius: 'var(--radius-md)',
        border: showOutline ? `1px dotted ${theme.colors.border}` : 'none',
        outline: menuOpen ? `3px solid ${theme.colors.primary}` : 'none',
        boxShadow: menuOpen ? `0 0 0 6px ${theme.colors.primary}30` : 'none',
        backgroundColor: menuOpen ? `${theme.colors.primary}10` : 'transparent',
        // See SongLayoutRow's identical comment -- without this the column's own menu can paint
        // behind unrelated siblings or the fixed-position metronome.
        zIndex: menuOpen ? 1000 : undefined,
      }}
    >
      {canEdit && (
        <div style={{
          position: 'absolute', top: '-14px', left: '50%', transform: 'translateX(-50%)', zIndex: 2,
          display: 'flex', alignItems: 'center', gap: '2px',
        }}
        >
          <SongLayoutMoveButton
            icon="arrow-left" label={t('guitarSong.layout.moveColumnLeft')} onClick={() => moveColumn('prev')} disabled={isFirstColumn}
          />
          <SongLayoutMoveButton
            icon="minus" label={t('guitarSong.layout.widthNarrower')} onClick={() => resizeColumn(-1)} disabled={column.width_twelfths <= 1}
          />
          <SongColumnMenu
            rows={rows} row={row} column={column} hook={hook} onOpenChange={setMenuOpen}
            direction={isLastRow ? 'up' : 'down'} song={song} clipboardHook={clipboardHook}
          />
          <SongLayoutMoveButton
            icon="plus" label={t('guitarSong.layout.widthWider')} onClick={() => resizeColumn(1)}
            disabled={layoutMutations.remainingRowWidthTwelfths(row) < 1}
          />
          <SongLayoutMoveButton
            icon="arrow-right" label={t('guitarSong.layout.moveColumnRight')} onClick={() => moveColumn('next')} disabled={isLastColumn}
          />
        </div>
      )}
      <div style={{ display: 'flex', flexWrap: 'wrap', gap: '8px', alignItems: 'flex-end', justifyContent: ALIGN_TO_JUSTIFY_CONTENT[column.align] }}>
        {column.blocks.map((block, index) => (
          <div
            key={`${block.block_type}-${index}`}
            style={{ flexBasis: blockFlexBasis(block, column.width_twelfths), flexShrink: 0, minWidth: 0, marginBottom: '8px' }}
          >
            <SongLayoutBlockContent
              block={block}
              row={row}
              columnId={column.id}
              blockIndex={index}
              isFirstBlock={index === 0}
              isLastBlock={index === column.blocks.length - 1}
              openUpward={isLastRow && index === column.blocks.length - 1}
              song={song}
              labelsHook={labelsHook}
              canEdit={canEdit}
              canManage={canManage}
              hook={hook}
              clipboardHook={clipboardHook}
              showStructureOutlines={showStructureOutlines}
            />
          </div>
        ))}
      </div>
    </div>
  );
};
