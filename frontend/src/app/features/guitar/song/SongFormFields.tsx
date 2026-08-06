import EditorJoditComponent from '@/app/platform/functions/documents/editor/EditorJoditComponent.tsx';
import { ThemedInput } from '@/app/platform/core/layout/themes/components/ThemedInput.tsx';
import { ThemedSelect } from '@/app/platform/core/layout/themes/components/ThemedSelect.tsx';
import { ThemedText } from '@/app/platform/core/layout/themes/components/ThemedText.tsx';

import React from 'react';
import { useTranslation } from 'react-i18next';

import { ChordDiagramSize, ChordDiagramStyle } from '../chords/ChordDiagram.tsx';
import { SongAuthorPicker } from './SongAuthorPicker.tsx';
import {
  MAX_BEATS_PER_BAR,
  MAX_CAPO,
  MAX_TEMPO_BPM,
  MIN_BEATS_PER_BAR,
  MIN_CAPO,
  MIN_TEMPO_BPM,
} from './songLimits.ts';
import { GuitarSongAuthor } from './types.ts';

interface SongFormFieldsProps {
  authors: GuitarSongAuthor[];
  title: string;
  onTitleChange: (value: string) => void;
  author: string;
  onAuthorChange: (value: string) => void;
  tempoBpm: number;
  onTempoBpmChange: (value: number) => void;
  beatsPerBar: number;
  onBeatsPerBarChange: (value: number) => void;
  capo: number;
  onCapoChange: (value: number) => void;
  diagramStyle: ChordDiagramStyle;
  onDiagramStyleChange: (value: ChordDiagramStyle) => void;
  diagramSize: ChordDiagramSize;
  onDiagramSizeChange: (value: ChordDiagramSize) => void;
  descriptionHtml: string;
  onDescriptionHtmlChange: (value: string) => void;
}

export const SongFormFields: React.FC<SongFormFieldsProps> = ({
  authors,
  title,
  onTitleChange,
  author,
  onAuthorChange,
  tempoBpm,
  onTempoBpmChange,
  beatsPerBar,
  onBeatsPerBarChange,
  capo,
  onCapoChange,
  diagramStyle,
  onDiagramStyleChange,
  diagramSize,
  onDiagramSizeChange,
  descriptionHtml,
  onDescriptionHtmlChange,
}) => {
  const { t } = useTranslation();

  const diagramStyleOptions = [
    { value: 'full', label: t('guitarSong.form.diagramStyleFull') },
    { value: 'simple', label: t('guitarSong.form.diagramStyleSimple') },
  ];
  const diagramSizeOptions = [
    { value: 'very_small', label: t('guitarSong.form.diagramSizeVerySmall') },
    { value: 'small', label: t('guitarSong.form.diagramSizeSmall') },
    { value: 'medium', label: t('guitarSong.form.diagramSizeMedium') },
    { value: 'large', label: t('guitarSong.form.diagramSizeLarge') },
  ];

  return (
    <>
      <ThemedInput
        label={t('guitarSong.form.title')}
        value={title}
        onChange={(e) => onTitleChange(e.target.value)}
        maxLength={255}
        required
      />
      <SongAuthorPicker authors={authors} value={author} onChange={onAuthorChange} />
      <ThemedInput
        label={t('guitarSong.form.tempoBpm')}
        type="number"
        min={MIN_TEMPO_BPM}
        max={MAX_TEMPO_BPM}
        value={tempoBpm}
        onChange={(e) => onTempoBpmChange(Number(e.target.value))}
      />
      <ThemedInput
        label={t('guitarSong.form.beatsPerBar')}
        type="number"
        min={MIN_BEATS_PER_BAR}
        max={MAX_BEATS_PER_BAR}
        value={beatsPerBar}
        onChange={(e) => onBeatsPerBarChange(Number(e.target.value))}
      />
      <ThemedInput
        label={t('guitarSong.form.capo')}
        type="number"
        min={MIN_CAPO}
        max={MAX_CAPO}
        value={capo}
        onChange={(e) => onCapoChange(Number(e.target.value))}
      />
      <ThemedSelect
        label={t('guitarSong.form.diagramStyle')}
        options={diagramStyleOptions}
        value={diagramStyle}
        allowEmpty={false}
        onChange={(value) => onDiagramStyleChange(value as ChordDiagramStyle)}
      />
      <ThemedSelect
        label={t('guitarSong.form.diagramSize')}
        options={diagramSizeOptions}
        value={diagramSize}
        allowEmpty={false}
        onChange={(value) => onDiagramSizeChange(value as ChordDiagramSize)}
      />
      <div>
        <ThemedText size="medium" as="h3" style={{ marginBottom: '8px' }}>
          {t('guitarSong.form.description')}
        </ThemedText>
        <div className="border border-gray-300 rounded-lg overflow-hidden">
          <EditorJoditComponent content={descriptionHtml} onChange={onDescriptionHtmlChange} compact minHeight={200} />
        </div>
      </div>
    </>
  );
};
