import { useTheme } from '@/app/platform/core/layout/themes/ThemeContext.tsx';

import React, { useState } from 'react';
import { useTranslation } from 'react-i18next';

import { SongColumnMenu } from './SongColumnMenu.tsx';
import { SongLayoutMoveColumnButton } from './SongLayoutMoveColumnButton.tsx';
import { SongLayoutBlockContent } from './SongLayoutBlockContent.tsx';
import { isCompactBlockType } from './layoutBlockOptions.ts';
import * as layoutMutations from './layoutMutations.ts';
import {
  GuitarSongDetail, GuitarSongLayoutBlock, GuitarSongLayoutColumn as LayoutColumn, GuitarSongLayoutRow, LayoutAlign,
  LAYOUT_ROW_WIDTH_EIGHTHS,
} from './types.ts';
import { useGuitarSong } from './useGuitarSong.ts';
import { useGuitarSongLabels } from './useGuitarSongLabels.ts';

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
}

// A block's width_eighths is on the same 0-8 scale as a row's columns — "3/8" means roughly
// 3/8 of the page, not 3/8 of whatever column it happens to sit in. CSS flex-basis percentages
// resolve against the column though, so this rescales the block's row-relative fraction into a
// column-relative one before handing it to flexBasis.
// text-align has no effect on flex items, only on inline content -- the blocks below are laid
// out as a flex row, so the column's align setting has to translate to justify-content instead.
const ALIGN_TO_JUSTIFY_CONTENT: Record<LayoutAlign, 'flex-start' | 'center' | 'flex-end'> = {
  left: 'flex-start', center: 'center', right: 'flex-end',
};

const blockFlexBasis = (block: GuitarSongLayoutBlock, columnWidthEighths: number): string => {
  if (block.width_eighths < LAYOUT_ROW_WIDTH_EIGHTHS) {
    const percentOfColumn = Math.min(100, (block.width_eighths / columnWidthEighths) * 100);
    return `${percentOfColumn}%`;
  }
  if (isCompactBlockType(block.block_type)) return 'auto';
  return '100%';
};

export const SongLayoutColumn: React.FC<SongLayoutColumnProps> = ({
  column, row, rows, isLastRow, isFirstColumn, isLastColumn, song, labelsHook, canEdit, canManage, hook,
}) => {
  const { t } = useTranslation();
  const { theme } = useTheme();
  const [menuOpen, setMenuOpen] = useState(false);
  const widthPercent = (column.width_eighths / LAYOUT_ROW_WIDTH_EIGHTHS) * 100;
  const padding = `${column.padding_top_mm}mm ${column.padding_right_mm}mm ${column.padding_bottom_mm}mm ${column.padding_left_mm}mm`;
  const moveColumn = (direction: 'prev' | 'next') =>
    hook.replaceLayoutRow(row.id, layoutMutations.moveColumn(row, column.id, direction));

  return (
    <div
      style={{
        width: `${widthPercent}%`, minWidth: 0, textAlign: column.align, padding, boxSizing: 'border-box', position: 'relative',
        borderRadius: 'var(--radius-md)',
        border: canEdit ? `1px dotted ${theme.colors.border}` : 'none',
        outline: menuOpen ? `3px solid ${theme.colors.primary}` : 'none',
        boxShadow: menuOpen ? `0 0 0 6px ${theme.colors.primary}30` : 'none',
        backgroundColor: menuOpen ? `${theme.colors.primary}10` : 'transparent',
      }}
    >
      {canEdit && (
        <div style={{
          position: 'absolute', top: '-14px', left: '50%', transform: 'translateX(-50%)', zIndex: 2,
          display: 'flex', alignItems: 'center', gap: '2px',
        }}
        >
          <SongLayoutMoveColumnButton
            icon="arrow-left" label={t('guitarSong.layout.moveColumnLeft')} onClick={() => moveColumn('prev')} disabled={isFirstColumn}
          />
          <SongColumnMenu rows={rows} row={row} column={column} hook={hook} onOpenChange={setMenuOpen} />
          <SongLayoutMoveColumnButton
            icon="arrow-right" label={t('guitarSong.layout.moveColumnRight')} onClick={() => moveColumn('next')} disabled={isLastColumn}
          />
        </div>
      )}
      <div style={{ display: 'flex', flexWrap: 'wrap', gap: '8px', alignItems: 'flex-end', justifyContent: ALIGN_TO_JUSTIFY_CONTENT[column.align] }}>
        {column.blocks.map((block, index) => (
          <div
            key={`${block.block_type}-${index}`}
            style={{ flexBasis: blockFlexBasis(block, column.width_eighths), flexShrink: 0, minWidth: 0, marginBottom: '8px' }}
          >
            <SongLayoutBlockContent
              block={block}
              row={row}
              columnId={column.id}
              blockIndex={index}
              openUpward={isLastRow && index === column.blocks.length - 1}
              song={song}
              labelsHook={labelsHook}
              canEdit={canEdit}
              canManage={canManage}
              hook={hook}
            />
          </div>
        ))}
      </div>
    </div>
  );
};
