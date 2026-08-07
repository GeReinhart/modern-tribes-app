import { IconName } from '@/app/platform/core/layout/themes/icons/ThemedSvgIcon.tsx';

import React from 'react';
import { useTranslation } from 'react-i18next';

import { SongIconChoiceButton } from './SongIconChoiceButton.tsx';
import { ChordDiagramSize, ChordDiagramStyle } from '../chords/ChordDiagram.tsx';
import { GuitarSongUpdate } from './types.ts';

interface SongChordDiagramPrefsProps {
  diagramStyle: ChordDiagramStyle;
  diagramSize: ChordDiagramSize;
  onSave: (data: GuitarSongUpdate) => Promise<void>;
}

// Distinct icons per row, and never reused across the two rows -- reusing the same glyph for
// "full" style and every size button was exactly what made the whole control read as "all the
// same icon". Every button (both rows) renders its icon at the same fixed size -- a size ramp
// that scales the icon itself reads as inconsistent/broken rather than as a deliberate ramp; the
// caption under each icon is what actually conveys very small/small/medium/large.
const STYLE_OPTIONS: Array<{ value: ChordDiagramStyle; icon: IconName; captionKey: string; labelKey: string }> = [
  { value: 'full', icon: 'layout', captionKey: 'guitarSong.form.diagramStyleFullShort', labelKey: 'guitarSong.form.diagramStyleFull' },
  { value: 'simple', icon: 'disc', captionKey: 'guitarSong.form.diagramStyleSimpleShort', labelKey: 'guitarSong.form.diagramStyleSimple' },
];

const SIZE_OPTIONS: Array<{ value: ChordDiagramSize; captionKey: string; labelKey: string }> = [
  { value: 'very_small', captionKey: 'guitarSong.form.diagramSizeVerySmallShort', labelKey: 'guitarSong.form.diagramSizeVerySmall' },
  { value: 'small', captionKey: 'guitarSong.form.diagramSizeSmallShort', labelKey: 'guitarSong.form.diagramSizeSmall' },
  { value: 'medium', captionKey: 'guitarSong.form.diagramSizeMediumShort', labelKey: 'guitarSong.form.diagramSizeMedium' },
  { value: 'large', captionKey: 'guitarSong.form.diagramSizeLargeShort', labelKey: 'guitarSong.form.diagramSizeLarge' },
];

export const SongChordDiagramPrefs: React.FC<SongChordDiagramPrefsProps> = ({ diagramStyle, diagramSize, onSave }) => {
  const { t } = useTranslation();

  return (
    <div style={{ display: 'flex', gap: '12px', flexWrap: 'wrap', marginBottom: '8px', alignItems: 'flex-start' }}>
      <div style={{ display: 'flex', gap: '4px' }}>
        {STYLE_OPTIONS.map(({ value, icon, captionKey, labelKey }) => (
          <SongIconChoiceButton
            key={value}
            icon={icon}
            caption={t(captionKey)}
            ariaLabel={t(labelKey)}
            selected={diagramStyle === value}
            onClick={() => onSave({ chord_diagram_style: value })}
          />
        ))}
      </div>
      <div style={{ display: 'flex', gap: '4px' }}>
        {SIZE_OPTIONS.map(({ value, captionKey, labelKey }) => (
          <SongIconChoiceButton
            key={value}
            icon="grid"
            caption={t(captionKey)}
            ariaLabel={t(labelKey)}
            selected={diagramSize === value}
            onClick={() => onSave({ chord_diagram_size: value })}
          />
        ))}
      </div>
    </div>
  );
};
