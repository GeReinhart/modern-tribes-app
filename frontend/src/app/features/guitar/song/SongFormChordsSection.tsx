import { ChordDiagramSize, ChordDiagramStyle } from '@/app/features/guitar/chords/ChordDiagram.tsx';
import { ThemedIconButton } from '@/app/platform/core/layout/themes/components/ThemedIconButton.tsx';

import React, { useState } from 'react';
import { useTranslation } from 'react-i18next';

import { AddChordToSongModal } from './AddChordToSongModal.tsx';
import { SongChordBadge } from './SongChordBadge.tsx';
import { swapAdjacent } from './arrayMutations.ts';
import { BlockChordInput, GuitarSongChord, GuitarSongLayoutBlockContentUpdate } from './types.ts';

interface SongFormChordsSectionProps {
  chords: GuitarSongChord[];
  diagramStyle: ChordDiagramStyle;
  diagramSize: ChordDiagramSize;
  canManage: boolean;
  onSave: (data: GuitarSongLayoutBlockContentUpdate) => Promise<void>;
}

export const SongFormChordsSection: React.FC<SongFormChordsSectionProps> = ({
  chords, diagramStyle, diagramSize, canManage, onSave,
}) => {
  const { t } = useTranslation();
  const [pickerOpen, setPickerOpen] = useState(false);
  const chordIds = chords.map((blockChord) => blockChord.chord_id);
  const asInput = (list: GuitarSongChord[]): BlockChordInput[] =>
    list.map((blockChord) => ({ chord_id: blockChord.chord_id, comment: blockChord.comment }));
  const updateChords = (updated: BlockChordInput[]) => onSave({ chords: updated });

  return (
    <div>
      <div style={{ display: 'flex', justifyContent: 'flex-end', alignItems: 'center', marginBottom: '8px' }}>
        <ThemedIconButton
          action={{ icon: 'plus', label: t('guitarSong.detail.addChord'), onClick: () => setPickerOpen(true) }}
        />
      </div>
      {chords.length > 0 && (
        <div style={{ display: 'flex', flexWrap: 'wrap', gap: '12px', marginBottom: '8px' }}>
          {chords.map((blockChord, index) => (
            <SongChordBadge
              key={blockChord.chord_id}
              chord={blockChord.chord}
              diagramStyle={diagramStyle}
              diagramSize={diagramSize}
              comment={blockChord.comment}
              isFirst={index === 0}
              isLast={index === chords.length - 1}
              onRemove={canManage ? () => updateChords(asInput(chords.filter((_, i) => i !== index))) : undefined}
              onCommentSave={canManage ? (comment) => updateChords(
                asInput(chords.map((c, i) => (i === index ? { ...c, comment } : c))),
              ) : undefined}
              onMoveUp={canManage ? () => updateChords(asInput(swapAdjacent(chords, index, 'prev'))) : undefined}
              onMoveDown={canManage ? () => updateChords(asInput(swapAdjacent(chords, index, 'next'))) : undefined}
            />
          ))}
        </div>
      )}
      <AddChordToSongModal
        isOpen={pickerOpen}
        existingChordIds={chordIds}
        diagramStyle={diagramStyle}
        onClose={() => setPickerOpen(false)}
        onPickChord={(chordId) => updateChords([...asInput(chords), { chord_id: chordId, comment: null }])}
      />
    </div>
  );
};
