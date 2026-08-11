import React from 'react';
import { useTranslation } from 'react-i18next';

import { SongInlineEditableNumber } from './SongInlineEditableField.tsx';
import { GuitarSongLayoutSettings, GuitarSongLayoutSettingsUpdate } from './types.ts';

type MarginField = keyof Pick<
  GuitarSongLayoutSettings,
  'margin_top_mm' | 'margin_right_mm' | 'margin_bottom_mm' | 'margin_left_mm' | 'footer_spacing_mm'
>;

const MARGIN_FIELDS: Array<[MarginField, string]> = [
  ['margin_top_mm', 'guitarSong.layout.marginTop'],
  ['margin_right_mm', 'guitarSong.layout.marginRight'],
  ['margin_bottom_mm', 'guitarSong.layout.marginBottom'],
  ['margin_left_mm', 'guitarSong.layout.marginLeft'],
  ['footer_spacing_mm', 'guitarSong.layout.footerSpacing'],
];

interface SongLayoutMarginsFormProps {
  settings: GuitarSongLayoutSettings;
  onSave: (data: GuitarSongLayoutSettingsUpdate) => Promise<void>;
}

// Every field applies immediately on blur, same as every other field in the block editor's own
// tabs -- no explicit save button, and the popup never closes on its own.
export const SongLayoutMarginsForm: React.FC<SongLayoutMarginsFormProps> = ({ settings, onSave }) => {
  const { t } = useTranslation();

  return (
    <div style={{ display: 'flex', gap: '8px', flexWrap: 'nowrap', overflowX: 'auto', alignItems: 'flex-end' }}>
      {MARGIN_FIELDS.map(([field, labelKey]) => (
        <div key={field} style={{ width: '100px', flexShrink: 0 }}>
          <SongInlineEditableNumber
            value={settings[field]} min={0} max={100}
            ariaLabel={t(labelKey)} label={t(labelKey)}
            onSave={(value) => onSave({ [field]: value })}
          />
        </div>
      ))}
    </div>
  );
};
