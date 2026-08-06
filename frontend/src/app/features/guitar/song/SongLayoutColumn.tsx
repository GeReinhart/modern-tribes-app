import React from 'react';

import { SongLayoutBlockContent } from './SongLayoutBlockContent.tsx';
import { isCompactBlockType } from './layoutBlockOptions.ts';
import {
  GuitarSongDetail, GuitarSongLabel, GuitarSongLayoutBlock, GuitarSongLayoutColumn as LayoutColumn,
  LAYOUT_ROW_WIDTH_EIGHTHS,
} from './types.ts';
import { useGuitarSong } from './useGuitarSong.ts';

interface SongLayoutColumnProps {
  column: LayoutColumn;
  song: GuitarSongDetail;
  labels: GuitarSongLabel[];
  chordsEditable: boolean;
  chordsManageable: boolean;
  hook: ReturnType<typeof useGuitarSong>;
}

const blockFlexBasis = (block: GuitarSongLayoutBlock): string => {
  if (isCompactBlockType(block.block_type)) return 'auto';
  if (block.block_type === 'custom' && block.width_eighths < LAYOUT_ROW_WIDTH_EIGHTHS) {
    return `${(block.width_eighths / LAYOUT_ROW_WIDTH_EIGHTHS) * 100}%`;
  }
  return '100%';
};

export const SongLayoutColumn: React.FC<SongLayoutColumnProps> = ({
  column, song, labels, chordsEditable, chordsManageable, hook,
}) => {
  const widthPercent = (column.width_eighths / LAYOUT_ROW_WIDTH_EIGHTHS) * 100;
  const padding = `${column.padding_top_mm}mm ${column.padding_right_mm}mm ${column.padding_bottom_mm}mm ${column.padding_left_mm}mm`;

  return (
    <div style={{ width: `${widthPercent}%`, textAlign: column.align, padding, boxSizing: 'border-box' }}>
      <div style={{ display: 'flex', flexWrap: 'wrap', gap: '8px', alignItems: 'flex-start' }}>
        {column.blocks.map((block, index) => (
          <div
            key={`${block.block_type}-${index}`}
            style={{
              flexBasis: blockFlexBasis(block),
              flexShrink: 0,
              marginBottom: '8px',
            }}
          >
            <SongLayoutBlockContent
              block={block}
              song={song}
              labels={labels}
              chordsEditable={chordsEditable}
              chordsManageable={chordsManageable}
              hook={hook}
            />
          </div>
        ))}
      </div>
    </div>
  );
};
