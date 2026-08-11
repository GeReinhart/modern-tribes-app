import { ChordDiagramSize, ChordDiagramStyle } from '@/app/features/guitar/chords/ChordDiagram.tsx';
import { ChordFormModal } from '@/app/features/guitar/chords/ChordFormModal.tsx';
import { ChordsFilterBar } from '@/app/features/guitar/chords/ChordsFilterBar.tsx';
import { guitarChordsService } from '@/app/features/guitar/chords/service.ts';
import { GuitarChordCreate } from '@/app/features/guitar/chords/types.ts';
import { useChordsFilter } from '@/app/features/guitar/chords/useChordsFilter.ts';
import { useGuitarChords } from '@/app/features/guitar/chords/useGuitarChords.ts';
import { ModalBody, ThemedModal } from '@/app/platform/core/layout/themes/components/ThemedModal.tsx';

import React, { useState } from 'react';
import { useTranslation } from 'react-i18next';

import { SongChordPickerCard } from './SongChordPickerCard.tsx';

// Fixed at "xs" regardless of the song's own diagram size -- this is a compact picker grid to
// browse and pick from, not the song's actual rendered content, so it stays small and consistent
// no matter how large the song itself is configured to show its chords.
const PICKER_DIAGRAM_SIZE: ChordDiagramSize = 'xs';

interface AddChordToSongModalProps {
  isOpen: boolean;
  existingChordIds: string[];
  diagramStyle: ChordDiagramStyle;
  onClose: () => void;
  onPickChord: (chordId: string) => Promise<void>;
}

export const AddChordToSongModal: React.FC<AddChordToSongModalProps> = ({
  isOpen,
  existingChordIds,
  diagramStyle,
  onClose,
  onPickChord,
}) => {
  const { t } = useTranslation();
  const { chords, reload } = useGuitarChords();
  const {
    search, setSearch, rootFilter, setRootFilter, fretFilter, onFretFilterChange, filteredChords,
  } = useChordsFilter(chords);
  const [createFormOpen, setCreateFormOpen] = useState(false);

  const handleCreateChord = async (data: GuitarChordCreate) => {
    const created = await guitarChordsService.createChord(data);
    await reload();
    await onPickChord(created.id);
  };

  return (
    <ThemedModal isOpen={isOpen} onClose={onClose} title={t('guitarSong.picker.title')} size="lg">
      <ModalBody>
        <div style={{ display: 'flex', flexDirection: 'column', gap: '16px' }}>
          <ChordsFilterBar
            search={search}
            onSearchChange={setSearch}
            rootFilter={rootFilter}
            onRootFilterChange={setRootFilter}
            fretFilter={fretFilter}
            onFretFilterChange={onFretFilterChange}
            onAdd={() => setCreateFormOpen(true)}
          />
          <div
            style={{
              display: 'grid', gridTemplateColumns: 'repeat(3, 1fr)', gap: '12px',
              maxHeight: '420px', overflowY: 'auto', paddingRight: '4px',
            }}
          >
            {filteredChords.map((chord) => (
              <SongChordPickerCard
                key={chord.id}
                chord={chord}
                alreadyInSong={existingChordIds.includes(chord.id)}
                diagramStyle={diagramStyle}
                diagramSize={PICKER_DIAGRAM_SIZE}
                onAdd={() => onPickChord(chord.id)}
              />
            ))}
          </div>
        </div>
      </ModalBody>
      <ChordFormModal isOpen={createFormOpen} onClose={() => setCreateFormOpen(false)} onSubmit={handleCreateChord} />
    </ThemedModal>
  );
};
