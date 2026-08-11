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

// Positioning rule for a cell's items: one chord sits at the cell's left; two chords behave as
// if the cell were split into two identical halves, each chord at the left of its own half;
// three or more are justified across the full width. Using flex-basis wrappers (not CSS grid)
// for the two-item case so the exact same layout renders in the PDF (WeasyPrint's flexbox
// support is solid, its grid support is not).
const chordGridRowStyle = (itemCount: number): React.CSSProperties => {
  if (itemCount === 2) return { display: 'flex', width: '100%' };
  return { display: 'flex', gap: '2px', alignItems: 'center', width: '100%', justifyContent: itemCount > 2 ? 'space-between' : 'flex-start' };
};

const ChordGridCellView: React.FC<ChordGridCellViewProps> = ({ cell, chordsById, diagramStyle, diagramSize, chordSizePx }) => {
  const { theme } = useTheme();
  const itemCount = cell.items.length;
  return (
    <td
      style={{
        borderTop: cell.border_top ? `${CELL_BORDER_STYLE} ${theme.colors.text}` : 'none',
        borderRight: cell.border_right ? `${CELL_BORDER_STYLE} ${theme.colors.text}` : 'none',
        borderBottom: cell.border_bottom ? `${CELL_BORDER_STYLE} ${theme.colors.text}` : 'none',
        borderLeft: cell.border_left ? `${CELL_BORDER_STYLE} ${theme.colors.text}` : 'none',
        padding: '8px', verticalAlign: 'middle',
      }}
    >
      <div style={chordGridRowStyle(itemCount)}>
        {cell.items.map((item, index) => (
          <div key={index} style={itemCount === 2 ? { flex: '1 1 0%', textAlign: 'left' } : undefined}>
            <ChordGridCellItemView
              item={item} chordsById={chordsById}
              diagramStyle={diagramStyle} diagramSize={diagramSize} chordSizePx={chordSizePx}
            />
          </div>
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
        <table style={{ borderCollapse: 'collapse', width: '100%', tableLayout: 'fixed' }}>
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
