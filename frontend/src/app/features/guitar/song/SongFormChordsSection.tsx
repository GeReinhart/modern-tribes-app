import { ChordDiagramSize, ChordDiagramStyle } from '@/app/features/guitar/chords/ChordDiagram.tsx';
import { ThemedIconButton } from '@/app/platform/core/layout/themes/components/ThemedIconButton.tsx';
import { ThemedText } from '@/app/platform/core/layout/themes/components/ThemedText.tsx';
import { useTheme } from '@/app/platform/core/layout/themes/ThemeContext.tsx';

import React, { useState } from 'react';
import { useTranslation } from 'react-i18next';

import { AddChordToSongModal } from './AddChordToSongModal.tsx';
import { SongChordBadge } from './SongChordBadge.tsx';
import { GuitarSongChord, GuitarSongChordCreate } from './types.ts';

interface SongFormChordsSectionProps {
  chords: GuitarSongChord[];
  diagramStyle: ChordDiagramStyle;
  diagramSize: ChordDiagramSize;
  canManage: boolean;
  onAddChord: (data: GuitarSongChordCreate) => Promise<void>;
  onRemoveChord: (songChordId: string) => Promise<void>;
}

export const SongFormChordsSection: React.FC<SongFormChordsSectionProps> = ({
  chords,
  diagramStyle,
  diagramSize,
  canManage,
  onAddChord,
  onRemoveChord,
}) => {
  const { theme } = useTheme();
  const { t } = useTranslation();
  const [pickerOpen, setPickerOpen] = useState(false);
  const chordIds = chords.map((songChord) => songChord.chord.id);

  return (
    <div>
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '8px' }}>
        <ThemedText size="medium" as="h3">{t('guitarSong.detail.chords')}</ThemedText>
        <ThemedIconButton
          action={{ icon: 'plus', label: t('guitarSong.detail.addChord'), onClick: () => setPickerOpen(true) }}
        />
      </div>
      {chords.length > 0 && (
        <div style={{ display: 'flex', flexWrap: 'wrap', gap: '12px', marginBottom: '8px' }}>
          {chords.map((songChord) => (
            <SongChordBadge
              key={songChord.id}
              chord={songChord.chord}
              diagramStyle={diagramStyle}
              diagramSize={diagramSize}
              onRemove={canManage ? () => onRemoveChord(songChord.id) : undefined}
            />
          ))}
        </div>
      )}
      <ThemedText size="small" style={{ color: theme.colors.secondary }}>
        {t('guitarSong.form.chordsHint')}
      </ThemedText>
      <AddChordToSongModal
        isOpen={pickerOpen}
        existingChordIds={chordIds}
        diagramStyle={diagramStyle}
        diagramSize={diagramSize}
        onClose={() => setPickerOpen(false)}
        onPickChord={async (chordId) => { await onAddChord({ chord_id: chordId }); }}
      />
    </div>
  );
};
