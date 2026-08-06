import { ChordDiagramSize, ChordDiagramStyle } from '@/app/features/guitar/chords/ChordDiagram.tsx';
import { GuitarChord } from '@/app/features/guitar/chords/types.ts';
import { ThemedCard } from '@/app/platform/core/layout/themes/components/ThemedCard.tsx';
import { ThemedText } from '@/app/platform/core/layout/themes/components/ThemedText.tsx';

import React from 'react';
import { useTranslation } from 'react-i18next';

import { sectionTypeSuggestions } from './sectionWords.ts';
import { SongSectionAddControl } from './SongSectionAddControl.tsx';
import { SongSectionEditCard } from './SongSectionEditCard.tsx';
import {
  GuitarSongSection,
  GuitarSongSectionChordCreate,
  GuitarSongSectionCreate,
  GuitarSongSectionLyricsUpdate,
  GuitarSongSectionUpdate,
  GuitarSongSectionWordChordUpdate,
  MoveDirection,
  WordChordPosition,
} from './types.ts';

interface SongFormSectionsSectionProps {
  sections: GuitarSongSection[];
  canManage: boolean;
  diagramStyle: ChordDiagramStyle;
  diagramSize: ChordDiagramSize;
  songChords: GuitarChord[];
  onAddSection: (data: GuitarSongSectionCreate) => Promise<void>;
  onUpdateSection: (sectionId: string, data: GuitarSongSectionUpdate) => Promise<void>;
  onMoveSection: (sectionId: string, direction: MoveDirection) => Promise<void>;
  onRemoveSection: (sectionId: string) => Promise<void>;
  onDuplicateSection: (sectionId: string) => Promise<void>;
  onSaveLyrics: (sectionId: string, data: GuitarSongSectionLyricsUpdate) => Promise<void>;
  onSetWordChord: (wordId: string, position: WordChordPosition, data: GuitarSongSectionWordChordUpdate) => Promise<void>;
  onAddChordToSection: (sectionId: string, data: GuitarSongSectionChordCreate) => Promise<void>;
  onMoveSectionChord: (sectionChordId: string, direction: MoveDirection) => Promise<void>;
  onRemoveSectionChord: (sectionChordId: string) => Promise<void>;
}

export const SongFormSectionsSection: React.FC<SongFormSectionsSectionProps> = ({
  sections,
  canManage,
  diagramStyle,
  diagramSize,
  songChords,
  onAddSection,
  onUpdateSection,
  onMoveSection,
  onRemoveSection,
  onDuplicateSection,
  onSaveLyrics,
  onSetWordChord,
  onAddChordToSection,
  onMoveSectionChord,
  onRemoveSectionChord,
}) => {
  const { t } = useTranslation();
  const typeSuggestions = sectionTypeSuggestions(sections);

  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: '12px' }}>
      <ThemedText size="medium" as="h3">{t('guitarSong.sections.title')}</ThemedText>
      {sections.map((section, index) => (
        <SongSectionEditCard
          key={section.id}
          section={section}
          isFirst={index === 0}
          isLast={index === sections.length - 1}
          canManage={canManage}
          typeSuggestions={typeSuggestions}
          diagramStyle={diagramStyle}
          diagramSize={diagramSize}
          songChords={songChords}
          onUpdate={(data) => onUpdateSection(section.id, data)}
          onMove={(direction) => onMoveSection(section.id, direction)}
          onRemove={() => onRemoveSection(section.id)}
          onDuplicate={() => onDuplicateSection(section.id)}
          onSaveLyrics={(text) => onSaveLyrics(section.id, { text })}
          onSetWordChord={onSetWordChord}
          onAddChordToSection={onAddChordToSection}
          onMoveSectionChord={onMoveSectionChord}
          onRemoveSectionChord={onRemoveSectionChord}
        />
      ))}
      <ThemedCard bordered className="p-3">
        <SongSectionAddControl typeSuggestions={typeSuggestions} onAdd={onAddSection} />
      </ThemedCard>
    </div>
  );
};
