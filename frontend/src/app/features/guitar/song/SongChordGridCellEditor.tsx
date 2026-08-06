import { ChordDiagram, ChordDiagramStyle } from '@/app/features/guitar/chords/ChordDiagram.tsx';
import { GuitarChord } from '@/app/features/guitar/chords/types.ts';
import { ThemedIconButton } from '@/app/platform/core/layout/themes/components/ThemedIconButton.tsx';
import { ThemedInput } from '@/app/platform/core/layout/themes/components/ThemedInput.tsx';
import { ThemedText } from '@/app/platform/core/layout/themes/components/ThemedText.tsx';
import { useTheme } from '@/app/platform/core/layout/themes/ThemeContext.tsx';

import React, { useState } from 'react';
import { useTranslation } from 'react-i18next';

import { addChordGridCellItem, moveChordGridCellItem, removeChordGridCellItem } from './chordGridMutations.ts';
import { SongChordGridBorderPicker } from './SongChordGridBorderPicker.tsx';
import { ChordGridCell } from './types.ts';

interface SongChordGridCellEditorProps {
  cell: ChordGridCell | null;
  songChords: GuitarChord[];
  diagramStyle: ChordDiagramStyle;
  canAddChord: boolean;
  onClose: () => void;
  onSave: (cell: ChordGridCell) => void;
}

// Inline panel, not its own popup -- this lives inside the chord grid's own "Content" tab of the
// block's edit popup, and a popup-inside-a-popup for picking a chord was both confusing and, with
// every song chord shown as a full-size button, far too tall.
// Every action below (add/move/remove an item, toggle a border) applies immediately via onSave --
// there is no local draft and no separate save step, so the grid always reflects the last click.
export const SongChordGridCellEditor: React.FC<SongChordGridCellEditorProps> = ({
  cell, songChords, diagramStyle, canAddChord, onClose, onSave,
}) => {
  const { t } = useTranslation();
  const { theme } = useTheme();
  const [textInput, setTextInput] = useState('');

  if (!cell) return null;

  const chordName = (chordId: string | null) => songChords.find((chord) => chord.id === chordId)?.name ?? chordId;

  const handleAddText = () => {
    if (!textInput.trim()) return;
    onSave(addChordGridCellItem(cell, { item_type: 'text', chord_id: null, text: textInput.trim() }));
    setTextInput('');
  };
  const handleAddChord = (chordId: string) => {
    if (!chordId) return;
    onSave(addChordGridCellItem(cell, { item_type: 'chord', chord_id: chordId, text: null }));
  };

  return (
    <div
      style={{
        display: 'flex', flexDirection: 'column', gap: '16px', border: `1px solid ${theme.colors.border}`,
        borderRadius: 'var(--radius-md)', padding: '12px', marginTop: '12px',
      }}
    >
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
        <ThemedText size="small">{t('guitarSong.chordGrid.editCell')}</ThemedText>
        <ThemedIconButton action={{ icon: 'x', label: t('common.close'), onClick: onClose }} />
      </div>
      <div>
        <SongChordGridBorderPicker cell={cell} onToggle={(side) => onSave({ ...cell, [side]: !cell[side] })}>
          <div style={{ display: 'flex', flexWrap: 'wrap', gap: '8px', alignItems: 'center', justifyContent: 'center' }}>
            {cell.items.map((item, index) => (
              <div key={index} style={{ display: 'flex', alignItems: 'center', gap: '2px' }}>
                <ThemedIconButton
                  action={{
                    icon: 'arrow-left', label: t('guitarSong.chordGrid.moveItemLeft'), disabled: index === 0,
                    onClick: () => onSave(moveChordGridCellItem(cell, index, 'prev')),
                  }}
                />
                <span style={{ fontWeight: item.item_type === 'chord' ? 700 : 400, color: theme.colors.text }}>
                  {item.item_type === 'chord' ? chordName(item.chord_id) : item.text}
                </span>
                <ThemedIconButton
                  action={{
                    icon: 'arrow-right', label: t('guitarSong.chordGrid.moveItemRight'),
                    disabled: index === cell.items.length - 1,
                    onClick: () => onSave(moveChordGridCellItem(cell, index, 'next')),
                  }}
                />
                <ThemedIconButton
                  action={{
                    icon: 'x', label: t('guitarSong.chordGrid.removeItem'), variant: 'danger',
                    onClick: () => onSave(removeChordGridCellItem(cell, index)),
                  }}
                />
              </div>
            ))}
          </div>
        </SongChordGridBorderPicker>
      </div>
      <div style={{ display: 'flex', gap: '8px', alignItems: 'flex-end' }}>
        <div style={{ flex: 1 }}>
          <ThemedInput
            value={textInput} onChange={(e) => setTextInput(e.target.value)} maxLength={50}
            placeholder={t('guitarSong.chordGrid.addTextPlaceholder')}
          />
        </div>
        <ThemedIconButton action={{ icon: 'plus', label: t('guitarSong.chordGrid.addText'), onClick: handleAddText }} />
      </div>
      {canAddChord ? (
        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(4, 1fr)', gap: '6px' }}>
          {songChords.map((chord) => (
            <button
              key={chord.id}
              type="button"
              onClick={() => handleAddChord(chord.id)}
              style={{
                display: 'flex', flexDirection: 'column', alignItems: 'center', gap: '2px',
                padding: '4px', borderRadius: 'var(--radius-md)', cursor: 'pointer',
                border: `1px solid ${theme.colors.border}`, backgroundColor: 'transparent',
              }}
            >
              <ChordDiagram frets={chord.frets} rootNote={chord.root_note} diagramStyle={diagramStyle} diagramSize="xxs" />
              <span style={{ fontSize: '13px', fontWeight: 700, color: theme.colors.text }}>{chord.name}</span>
            </button>
          ))}
        </div>
      ) : (
        <ThemedText size="small">{t('guitarSong.chordGrid.needsChordsBlock')}</ThemedText>
      )}
    </div>
  );
};
