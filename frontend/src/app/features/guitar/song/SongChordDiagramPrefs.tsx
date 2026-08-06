import { ThemedSelect } from '@/app/platform/core/layout/themes/components/ThemedSelect.tsx';

import React from 'react';
import { useTranslation } from 'react-i18next';

import { ChordDiagramSize, ChordDiagramStyle } from '../chords/ChordDiagram.tsx';
import { GuitarSongUpdate } from './types.ts';

interface SongChordDiagramPrefsProps {
  diagramStyle: ChordDiagramStyle;
  diagramSize: ChordDiagramSize;
  onSave: (data: GuitarSongUpdate) => Promise<void>;
}

export const SongChordDiagramPrefs: React.FC<SongChordDiagramPrefsProps> = ({ diagramStyle, diagramSize, onSave }) => {
  const { t } = useTranslation();

  const styleOptions = [
    { value: 'full', label: t('guitarSong.form.diagramStyleFull') },
    { value: 'simple', label: t('guitarSong.form.diagramStyleSimple') },
  ];
  const sizeOptions = [
    { value: 'very_small', label: t('guitarSong.form.diagramSizeVerySmall') },
    { value: 'small', label: t('guitarSong.form.diagramSizeSmall') },
    { value: 'medium', label: t('guitarSong.form.diagramSizeMedium') },
    { value: 'large', label: t('guitarSong.form.diagramSizeLarge') },
  ];

  return (
    <div style={{ display: 'flex', gap: '8px', flexWrap: 'wrap', marginBottom: '8px' }}>
      <div style={{ width: '160px' }}>
        <ThemedSelect
          label={t('guitarSong.form.diagramStyle')}
          options={styleOptions}
          value={diagramStyle}
          allowEmpty={false}
          onChange={(value) => onSave({ chord_diagram_style: value as ChordDiagramStyle })}
        />
      </div>
      <div style={{ width: '160px' }}>
        <ThemedSelect
          label={t('guitarSong.form.diagramSize')}
          options={sizeOptions}
          value={diagramSize}
          allowEmpty={false}
          onChange={(value) => onSave({ chord_diagram_size: value as ChordDiagramSize })}
        />
      </div>
    </div>
  );
};
