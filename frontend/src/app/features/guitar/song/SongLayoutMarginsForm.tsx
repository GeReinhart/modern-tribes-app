import { ThemedCard } from '@/app/platform/core/layout/themes/components/ThemedCard.tsx';
import { ThemedInput } from '@/app/platform/core/layout/themes/components/ThemedInput.tsx';
import { ThemedText } from '@/app/platform/core/layout/themes/components/ThemedText.tsx';

import React from 'react';
import { useTranslation } from 'react-i18next';

import { GuitarSongLayoutSettingsUpdate } from './types.ts';

export type MarginsDraft = Required<GuitarSongLayoutSettingsUpdate>;

interface SongLayoutMarginsFormProps {
  value: MarginsDraft;
  onChange: (value: MarginsDraft) => void;
}

export const SongLayoutMarginsForm: React.FC<SongLayoutMarginsFormProps> = ({ value, onChange }) => {
  const { t } = useTranslation();

  const fields: Array<[keyof MarginsDraft, string]> = [
    ['margin_top_mm', t('guitarSong.layout.marginTop')],
    ['margin_right_mm', t('guitarSong.layout.marginRight')],
    ['margin_bottom_mm', t('guitarSong.layout.marginBottom')],
    ['margin_left_mm', t('guitarSong.layout.marginLeft')],
  ];

  return (
    <ThemedCard bordered className="p-3">
      <ThemedText size="medium" as="h3">{t('guitarSong.layout.pageMargins')}</ThemedText>
      <div style={{ display: 'flex', gap: '8px', flexWrap: 'nowrap', overflowX: 'auto', alignItems: 'flex-end', marginTop: '8px' }}>
        {fields.map(([field, label]) => (
          <div key={field} style={{ width: '70px', flexShrink: 0 }}>
            <ThemedInput
              label={label}
              type="number"
              min={0}
              max={100}
              value={value[field]}
              onChange={(e) => onChange({ ...value, [field]: Number(e.target.value) })}
            />
          </div>
        ))}
      </div>
    </ThemedCard>
  );
};
