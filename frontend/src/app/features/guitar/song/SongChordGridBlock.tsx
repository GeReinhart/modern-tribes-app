import { ChordDiagramSize, ChordDiagramStyle } from '@/app/features/guitar/chords/ChordDiagram.tsx';
import { useTheme } from '@/app/platform/core/layout/themes/ThemeContext.tsx';

import React from 'react';

import { SongChordBadge } from './SongChordBadge.tsx';
import { SongFreeformHtml } from './SongFreeformHtml.tsx';
import { ChordGridCell, ChordGridCellItem, GuitarSongChord } from './types.ts';

const CELL_BORDER_STYLE = '1px solid';

// The rich-text editor never actually saves an empty string for "nothing typed" -- it saves an
// empty paragraph (e.g. "<p><br></p>"), which is truthy and would otherwise still render a
// blank line taking up space. An embedded image with no surrounding text is NOT blank, even
// though stripping every tag leaves no text behind -- content is blank only when it has neither
// text nor an image.
export const isBlankHtml = (html: string | null): boolean => {
  if (!html) return true;
  if (/<img\b/i.test(html)) return false;
  return !html.replace(/<[^>]*>/g, '').replace(/&nbsp;/g, '').trim();
};

interface ChordGridCellViewProps {
  cell: ChordGridCell;
  chordsById: Record<string, GuitarSongChord['chord']>;
  diagramStyle: ChordDiagramStyle;
  diagramSize: ChordDiagramSize;
  chordSizePx: number;
}

const ChordGridCellItemView: React.FC<{ item: ChordGridCellItem; chordsById: ChordGridCellViewProps['chordsById'];
  diagramStyle: ChordDiagramStyle; diagramSize: ChordDiagramSize; chordSizePx: number }> = ({
  item, chordsById, diagramStyle, diagramSize, chordSizePx,
}) => {
  const { theme } = useTheme();
  if (item.item_type === 'chord') {
    const chord = item.chord_id ? chordsById[item.chord_id] : undefined;
    return chord ? (
      <SongChordBadge chord={chord} diagramStyle={diagramStyle} diagramSize={diagramSize} fontSizePx={chordSizePx} />
    ) : null;
  }
  return <span style={{ color: theme.colors.text, fontSize: `${chordSizePx}px` }}>{item.text}</span>;
};

const ChordGridCellView: React.FC<ChordGridCellViewProps> = ({ cell, chordsById, diagramStyle, diagramSize, chordSizePx }) => {
  const { theme } = useTheme();
  return (
    <td
      style={{
        borderTop: cell.border_top ? `${CELL_BORDER_STYLE} ${theme.colors.text}` : 'none',
        borderRight: cell.border_right ? `${CELL_BORDER_STYLE} ${theme.colors.text}` : 'none',
        borderBottom: cell.border_bottom ? `${CELL_BORDER_STYLE} ${theme.colors.text}` : 'none',
        borderLeft: cell.border_left ? `${CELL_BORDER_STYLE} ${theme.colors.text}` : 'none',
        padding: '8px', textAlign: 'center', verticalAlign: 'middle',
      }}
    >
      <div style={{ display: 'flex', gap: '2px', justifyContent: 'center', flexWrap: 'wrap', alignItems: 'center' }}>
        {cell.items.map((item, index) => (
          <ChordGridCellItemView
            key={index} item={item} chordsById={chordsById}
            diagramStyle={diagramStyle} diagramSize={diagramSize} chordSizePx={chordSizePx}
          />
        ))}
      </div>
    </td>
  );
};

interface SongChordGridBlockProps {
  rows: ChordGridCell[][];
  songChords: GuitarSongChord[];
  comment: string | null;
  diagramStyle: ChordDiagramStyle;
  diagramSize: ChordDiagramSize;
  chordSizePx: number;
}

export const SongChordGridBlock: React.FC<SongChordGridBlockProps> = ({
  rows, songChords, comment, diagramStyle, diagramSize, chordSizePx,
}) => {
  const chordsById = Object.fromEntries(songChords.map((songChord) => [songChord.chord.id, songChord.chord]));

  return (
    <div>
      {rows.length > 0 && (
        <table style={{ borderCollapse: 'collapse', width: '100%' }}>
          <tbody>
            {rows.map((row, rowIndex) => (
              <tr key={rowIndex}>
                {row.map((cell, columnIndex) => (
                  <ChordGridCellView
                    key={columnIndex} cell={cell} chordsById={chordsById}
                    diagramStyle={diagramStyle} diagramSize={diagramSize} chordSizePx={chordSizePx}
                  />
                ))}
              </tr>
            ))}
          </tbody>
        </table>
      )}
      {!isBlankHtml(comment) && <SongFreeformHtml html={comment as string} style={{ marginTop: '8px' }} />}
    </div>
  );
};
