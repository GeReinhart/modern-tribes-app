import { ChordDiagramStyle } from '@/app/features/guitar/chords/ChordDiagram.tsx';
import { GuitarChord } from '@/app/features/guitar/chords/types.ts';
import { useTheme } from '@/app/platform/core/layout/themes/ThemeContext.tsx';

import React, { useState } from 'react';
import { useTranslation } from 'react-i18next';

import { SongChordGridCellEditor } from './SongChordGridCellEditor.tsx';
import { SongInlineEditableNumber } from './SongInlineEditableField.tsx';
import { SongLayoutMoveButton } from './SongLayoutMoveButton.tsx';
import {
  insertChordGridColumn, insertChordGridRow, removeChordGridColumn, removeChordGridRow, updateChordGridCell,
} from './chordGridMutations.ts';
import { MAX_CHORD_GRID_CHORD_SIZE_PX, MIN_CHORD_GRID_CHORD_SIZE_PX } from './songLimits.ts';
import { ChordGridCell, GuitarSongChord, GuitarSongLayoutBlockContentUpdate } from './types.ts';

interface SongFormChordGridSectionProps {
  rows: ChordGridCell[][];
  songChords: GuitarSongChord[];
  diagramStyle: ChordDiagramStyle;
  chordSizePx: number;
  canAddChord: boolean;
  onSave: (data: GuitarSongLayoutBlockContentUpdate) => Promise<void>;
}

const cellSummary = (cell: ChordGridCell, chordsById: Record<string, GuitarChord>): string =>
  cell.items
    .map((item) => (item.item_type === 'chord' ? chordsById[item.chord_id ?? '']?.name ?? '?' : item.text))
    .join(' ');

export const SongFormChordGridSection: React.FC<SongFormChordGridSectionProps> = ({
  rows, songChords, diagramStyle, chordSizePx, canAddChord, onSave,
}) => {
  const { t } = useTranslation();
  const { theme } = useTheme();
  const [editingCell, setEditingCell] = useState<{ rowIndex: number; columnIndex: number } | null>(null);
  const columnCount = rows[0]?.length ?? 0;
  const chords = songChords.map((songChord) => songChord.chord);
  const chordsById = Object.fromEntries(chords.map((chord) => [chord.id, chord]));

  const updateRows = (updatedRows: ChordGridCell[][]) => onSave({ chord_grid_rows: updatedRows });
  const cellStyle = (cell: ChordGridCell): React.CSSProperties => ({
    cursor: 'pointer', padding: '10px', minWidth: '64px', textAlign: 'center', color: theme.colors.text,
    borderTop: cell.border_top ? `1px solid ${theme.colors.text}` : `1px dashed ${theme.colors.border}`,
    borderRight: cell.border_right ? `1px solid ${theme.colors.text}` : `1px dashed ${theme.colors.border}`,
    borderBottom: cell.border_bottom ? `1px solid ${theme.colors.text}` : `1px dashed ${theme.colors.border}`,
    borderLeft: cell.border_left ? `1px solid ${theme.colors.text}` : `1px dashed ${theme.colors.border}`,
  });

  return (
    <div>
      <SongInlineEditableNumber
        value={chordSizePx} min={MIN_CHORD_GRID_CHORD_SIZE_PX} max={MAX_CHORD_GRID_CHORD_SIZE_PX}
        ariaLabel={t('guitarSong.chordGrid.chordSize')} label={t('guitarSong.chordGrid.chordSize')}
        onSave={(chord_grid_chord_size_px) => onSave({ chord_grid_chord_size_px })}
        style={{ width: '110px', marginBottom: '8px' }}
      />
      <div style={{ overflowX: 'auto' }}>
        <table style={{ borderCollapse: 'collapse' }}>
          <tbody>
            <tr>
              <td />
              {Array.from({ length: columnCount }, (_, columnIndex) => (
                <td key={columnIndex} style={{ textAlign: 'center' }}>
                  <SongLayoutMoveButton
                    icon="plus" label={t('guitarSong.chordGrid.addColumnBefore')} disabled={false}
                    onClick={() => updateRows(insertChordGridColumn(rows, columnIndex))}
                  />
                </td>
              ))}
              <td style={{ textAlign: 'center' }}>
                <SongLayoutMoveButton
                  icon="plus" label={t('guitarSong.chordGrid.addColumnAfter')} disabled={false}
                  onClick={() => updateRows(insertChordGridColumn(rows, columnCount))}
                />
              </td>
            </tr>
            {rows.map((row, rowIndex) => (
              <tr key={rowIndex}>
                <td>
                  <div style={{ display: 'flex', flexDirection: 'column', gap: '2px' }}>
                    <SongLayoutMoveButton
                      icon="plus" label={t('guitarSong.chordGrid.addRowBefore')} disabled={false}
                      onClick={() => updateRows(insertChordGridRow(rows, rowIndex))}
                    />
                    <SongLayoutMoveButton
                      icon="trash" label={t('guitarSong.chordGrid.removeRow')} disabled={rows.length <= 1}
                      onClick={() => updateRows(removeChordGridRow(rows, rowIndex))}
                    />
                  </div>
                </td>
                {row.map((cell, columnIndex) => (
                  <td
                    key={columnIndex} style={cellStyle(cell)}
                    onClick={() => setEditingCell({ rowIndex, columnIndex })}
                  >
                    {cellSummary(cell, chordsById) || '···'}
                  </td>
                ))}
              </tr>
            ))}
            <tr>
              <td>
                <SongLayoutMoveButton
                  icon="plus" label={t('guitarSong.chordGrid.addRowAfter')} disabled={false}
                  onClick={() => updateRows(insertChordGridRow(rows, rows.length))}
                />
              </td>
              {Array.from({ length: columnCount }, (_, columnIndex) => (
                <td key={columnIndex} style={{ textAlign: 'center' }}>
                  <SongLayoutMoveButton
                    icon="trash" label={t('guitarSong.chordGrid.removeColumn')} disabled={columnCount <= 1}
                    onClick={() => updateRows(removeChordGridColumn(rows, columnIndex))}
                  />
                </td>
              ))}
            </tr>
          </tbody>
        </table>
      </div>
      <SongChordGridCellEditor
        key={editingCell ? `${editingCell.rowIndex}-${editingCell.columnIndex}` : 'closed'}
        cell={editingCell ? rows[editingCell.rowIndex][editingCell.columnIndex] : null}
        songChords={chords}
        diagramStyle={diagramStyle}
        canAddChord={canAddChord}
        onClose={() => setEditingCell(null)}
        onSave={(updatedCell) => {
          if (!editingCell) return;
          updateRows(updateChordGridCell(rows, editingCell.rowIndex, editingCell.columnIndex, updatedCell));
        }}
      />
    </div>
  );
};
