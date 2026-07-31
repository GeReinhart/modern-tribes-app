import { ChordDiagramSize, ChordDiagramStyle } from '@/app/features/guitar/chords/ChordDiagram.tsx';
import { ChordFormModal } from '@/app/features/guitar/chords/ChordFormModal.tsx';
import { ChordsFilterBar } from '@/app/features/guitar/chords/ChordsFilterBar.tsx';
import { filterGuitarChords } from '@/app/features/guitar/chords/filterChords.ts';
import { guitarChordsService } from '@/app/features/guitar/chords/service.ts';
import { GuitarChordCreate } from '@/app/features/guitar/chords/types.ts';
import { useGuitarChords } from '@/app/features/guitar/chords/useGuitarChords.ts';
import { ModalBody, ThemedModal } from '@/app/platform/core/layout/themes/components/ThemedModal.tsx';

import React, { useMemo, useState } from 'react';
import { useTranslation } from 'react-i18next';

import { SongChordPickerCard } from './SongChordPickerCard.tsx';

interface AddChordToSongModalProps {
  isOpen: boolean;
  existingChordIds: string[];
  diagramStyle: ChordDiagramStyle;
  diagramSize: ChordDiagramSize;
  onClose: () => void;
  onPickChord: (chordId: string) => Promise<void>;
}

export const AddChordToSongModal: React.FC<AddChordToSongModalProps> = ({
  isOpen,
  existingChordIds,
  diagramStyle,
  diagramSize,
  onClose,
  onPickChord,
}) => {
  const { t } = useTranslation();
  const { chords, reload } = useGuitarChords();
  const [search, setSearch] = useState('');
  const [rootFilter, setRootFilter] = useState('');
  const [createFormOpen, setCreateFormOpen] = useState(false);

  const filteredChords = useMemo(
    () => filterGuitarChords(chords, search, rootFilter),
    [chords, search, rootFilter],
  );

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
            onAdd={() => setCreateFormOpen(true)}
          />
          <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(220px, 1fr))', gap: '12px' }}>
            {filteredChords.map((chord) => (
              <SongChordPickerCard
                key={chord.id}
                chord={chord}
                alreadyInSong={existingChordIds.includes(chord.id)}
                diagramStyle={diagramStyle}
                diagramSize={diagramSize}
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
