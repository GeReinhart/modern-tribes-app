import { ChordDiagram, ChordDiagramSize, ChordDiagramStyle } from '@/app/features/guitar/chords/ChordDiagram.tsx';
import { GuitarChord } from '@/app/features/guitar/chords/types.ts';
import { ThemedIconButton } from '@/app/platform/core/layout/themes/components/ThemedIconButton.tsx';
import { ThemedSelect } from '@/app/platform/core/layout/themes/components/ThemedSelect.tsx';
import { useTheme } from '@/app/platform/core/layout/themes/ThemeContext.tsx';

import React from 'react';
import { useTranslation } from 'react-i18next';

import { GuitarSongSection, GuitarSongSectionChordCreate, MoveDirection } from './types.ts';

interface SongSectionChordsOnlyEditorProps {
  section: GuitarSongSection;
  diagramStyle: ChordDiagramStyle;
  diagramSize: ChordDiagramSize;
  songChords: GuitarChord[];
  onAddChord: (sectionId: string, data: GuitarSongSectionChordCreate) => Promise<void>;
  onMoveChord: (sectionChordId: string, direction: MoveDirection) => Promise<void>;
  onRemoveChord: (sectionChordId: string) => Promise<void>;
}

export const SongSectionChordsOnlyEditor: React.FC<SongSectionChordsOnlyEditorProps> = ({
  section,
  diagramStyle,
  diagramSize,
  songChords,
  onAddChord,
  onMoveChord,
  onRemoveChord,
}) => {
  const { theme } = useTheme();
  const { t } = useTranslation();
  const chordOptions = songChords.map((chord) => ({ value: chord.id, label: chord.name }));

  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: '8px' }}>
      <div style={{ fontSize: '13px', fontWeight: 600, color: theme.colors.secondary }}>
        {t('guitarSong.sections.chordSequence')}
      </div>
      <div style={{ display: 'flex', flexWrap: 'wrap', gap: '16px' }}>
        {section.chords.map((sectionChord, index) => (
          <div key={sectionChord.id} style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', gap: '4px' }}>
            <div style={{ display: 'flex', gap: '2px' }}>
              <ThemedIconButton
                action={{
                  icon: 'chevron-up',
                  label: t('guitarSong.detail.moveUp'),
                  onClick: () => onMoveChord(sectionChord.id, 'prev'),
                  disabled: index === 0,
                }}
              />
              <ThemedIconButton
                action={{
                  icon: 'chevron-down',
                  label: t('guitarSong.detail.moveDown'),
                  onClick: () => onMoveChord(sectionChord.id, 'next'),
                  disabled: index === section.chords.length - 1,
                }}
              />
              <ThemedIconButton
                action={{
                  icon: 'trash',
                  label: t('guitarSong.detail.removeChord'),
                  onClick: () => onRemoveChord(sectionChord.id),
                  variant: 'danger',
                }}
              />
            </div>
            <div style={{ fontWeight: 700, color: theme.colors.text }}>{sectionChord.chord.name}</div>
            <ChordDiagram
              frets={sectionChord.chord.frets}
              rootNote={sectionChord.chord.root_note}
              diagramStyle={diagramStyle}
              diagramSize={diagramSize}
            />
          </div>
        ))}
        <div style={{ width: '160px' }}>
          <ThemedSelect
            options={chordOptions}
            value=""
            allowEmpty
            placeholder={t('guitarSong.sections.addChordToSequence')}
            onChange={(chordId) => chordId && onAddChord(section.id, { chord_id: chordId })}
          />
        </div>
      </div>
    </div>
  );
};
