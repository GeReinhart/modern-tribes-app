import { ChordDiagramSize, ChordDiagramStyle } from '@/app/features/guitar/chords/ChordDiagram.tsx';
import { GuitarChord } from '@/app/features/guitar/chords/types.ts';
import { ThemedCard } from '@/app/platform/core/layout/themes/components/ThemedCard.tsx';
import { ThemedIconButton } from '@/app/platform/core/layout/themes/components/ThemedIconButton.tsx';
import { ThemedInput } from '@/app/platform/core/layout/themes/components/ThemedInput.tsx';
import { ThemedSelect } from '@/app/platform/core/layout/themes/components/ThemedSelect.tsx';
import { useTheme } from '@/app/platform/core/layout/themes/ThemeContext.tsx';
import { ThemedSvgIcon } from '@/app/platform/core/layout/themes/icons/ThemedSvgIcon.tsx';

import React, { useState } from 'react';
import { useTranslation } from 'react-i18next';

import { SongSectionChordsOnlyEditor } from './SongSectionChordsOnlyEditor.tsx';
import { SongSectionLyricsEditor } from './SongSectionLyricsEditor.tsx';
import {
  GuitarSongLayoutBlock,
  GuitarSongSection,
  GuitarSongSectionChordCreate,
  GuitarSongSectionUpdate,
  GuitarSongSectionWordChordUpdate,
  MoveDirection,
  WordChordPosition,
} from './types.ts';

interface SongSectionEditCardProps {
  section: GuitarSongSection;
  allSections: GuitarSongSection[];
  isFirst: boolean;
  isLast: boolean;
  canManage: boolean;
  typeSuggestions: string[];
  sectionsBlocks: GuitarSongLayoutBlock[];
  diagramStyle: ChordDiagramStyle;
  diagramSize: ChordDiagramSize;
  songChords: GuitarChord[];
  onUpdate: (data: GuitarSongSectionUpdate) => Promise<void>;
  onMove: (direction: MoveDirection) => Promise<void>;
  onRemove: () => Promise<void>;
  onDuplicate: () => Promise<void>;
  onSaveLyrics: (text: string) => Promise<void>;
  onSetWordChord: (wordId: string, position: WordChordPosition, data: GuitarSongSectionWordChordUpdate) => Promise<void>;
  onAddChordToSection: (sectionId: string, data: GuitarSongSectionChordCreate) => Promise<void>;
  onMoveSectionChord: (sectionChordId: string, direction: MoveDirection) => Promise<void>;
  onRemoveSectionChord: (sectionChordId: string) => Promise<void>;
}

export const SongSectionEditCard: React.FC<SongSectionEditCardProps> = ({
  section,
  allSections,
  isFirst,
  isLast,
  canManage,
  typeSuggestions,
  sectionsBlocks,
  diagramStyle,
  diagramSize,
  songChords,
  onUpdate,
  onMove,
  onRemove,
  onDuplicate,
  onSaveLyrics,
  onSetWordChord,
  onAddChordToSection,
  onMoveSectionChord,
  onRemoveSectionChord,
}) => {
  const { theme } = useTheme();
  const { t } = useTranslation();
  const [typeLabel, setTypeLabel] = useState(section.type_label);
  const [customLabel, setCustomLabel] = useState(section.custom_label ?? '');
  const datalistId = `section-type-suggestions-${section.id}`;
  const linkedSource = section.linked_to_section_id
    ? allSections.find((candidate) => candidate.id === section.linked_to_section_id)
    : undefined;

  const saveTypeLabel = () => {
    if (typeLabel.trim() && typeLabel !== section.type_label) onUpdate({ type_label: typeLabel.trim() });
  };
  const saveCustomLabel = () => {
    if (customLabel !== (section.custom_label ?? '')) onUpdate({ custom_label: customLabel.trim() || null });
  };

  return (
    <ThemedCard bordered className="p-4">
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', gap: '12px', marginBottom: '12px' }}>
        <div style={{ display: 'flex', gap: '8px', flexWrap: 'wrap', flex: 1 }}>
          <div>
            <ThemedInput
              value={typeLabel}
              onChange={(e) => setTypeLabel(e.target.value)}
              onBlur={saveTypeLabel}
              list={datalistId}
              placeholder={t('guitarSong.sections.typeLabel')}
            />
            <datalist id={datalistId}>
              {typeSuggestions.map((suggestion) => <option key={suggestion} value={suggestion} />)}
            </datalist>
          </div>
          <ThemedInput
            value={customLabel}
            onChange={(e) => setCustomLabel(e.target.value)}
            onBlur={saveCustomLabel}
            placeholder={t('guitarSong.sections.customLabelPlaceholder')}
          />
          {sectionsBlocks.length > 1 && (
            <div style={{ minWidth: '160px' }}>
              <ThemedSelect
                label={t('guitarSong.sections.blockAssignment')}
                options={sectionsBlocks.map((sectionsBlock, index) => ({
                  value: sectionsBlock.id,
                  label: sectionsBlock.custom_title || t('guitarSong.sections.blockOption', { index: index + 1 }),
                }))}
                value={section.layout_block_id ?? ''}
                onChange={(value) => onUpdate({ layout_block_id: value || null })}
                placeholder={t('guitarSong.sections.blockUnassigned')}
                allowEmpty
              />
            </div>
          )}
        </div>
        {canManage && (
          <div style={{ display: 'flex', gap: '2px' }}>
            <ThemedIconButton
              action={{ icon: 'chevron-up', label: t('guitarSong.detail.moveUp'), onClick: () => onMove('prev'), disabled: isFirst }}
            />
            <ThemedIconButton
              action={{ icon: 'chevron-down', label: t('guitarSong.detail.moveDown'), onClick: () => onMove('next'), disabled: isLast }}
            />
            <ThemedIconButton
              action={{ icon: 'copy', label: t('guitarSong.sections.duplicate'), onClick: onDuplicate }}
            />
            <ThemedIconButton
              action={{ icon: 'trash', label: t('guitarSong.sections.remove'), onClick: onRemove, variant: 'danger' }}
            />
          </div>
        )}
      </div>
      <div style={{ fontSize: '15px', fontWeight: 600, color: theme.colors.text, marginBottom: '8px' }}>
        {t('guitarSong.sections.displayLabel', { label: section.display_label })}
      </div>
      {linkedSource && (
        <div style={{ display: 'flex', alignItems: 'center', gap: '4px', color: theme.colors.secondary, fontSize: '13px', marginBottom: '8px' }}>
          <ThemedSvgIcon name="link" size={12} color={theme.colors.secondary} />
          {t('guitarSong.sections.linkedTo')} {linkedSource.display_label}
        </div>
      )}
      {section.content_mode === 'lyrics' ? (
        <SongSectionLyricsEditor
          section={section}
          songChords={songChords}
          onSaveText={onSaveLyrics}
          onSetWordChord={onSetWordChord}
        />
      ) : (
        <SongSectionChordsOnlyEditor
          section={section}
          diagramStyle={diagramStyle}
          diagramSize={diagramSize}
          songChords={songChords}
          onAddChord={onAddChordToSection}
          onMoveChord={onMoveSectionChord}
          onRemoveChord={onRemoveSectionChord}
        />
      )}
    </ThemedCard>
  );
};
