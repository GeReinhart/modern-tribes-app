import { ThemedButton } from '@/app/platform/core/layout/themes/components/ThemedButton.tsx';
import { ThemedInput } from '@/app/platform/core/layout/themes/components/ThemedInput.tsx';
import { ThemedSelect } from '@/app/platform/core/layout/themes/components/ThemedSelect.tsx';

import React, { useState } from 'react';
import { useTranslation } from 'react-i18next';

import { GuitarSongSectionCreate, SectionContentMode } from './types.ts';

interface SongSectionAddControlProps {
  typeSuggestions: string[];
  onAdd: (data: GuitarSongSectionCreate) => Promise<void>;
}

export const SongSectionAddControl: React.FC<SongSectionAddControlProps> = ({ typeSuggestions, onAdd }) => {
  const { t } = useTranslation();
  const [typeLabel, setTypeLabel] = useState('');
  const [contentMode, setContentMode] = useState<SectionContentMode>('lyrics');
  const [adding, setAdding] = useState(false);

  const contentModeOptions = [
    { value: 'lyrics', label: t('guitarSong.sections.modeLyrics') },
    { value: 'chords_only', label: t('guitarSong.sections.modeChordsOnly') },
  ];

  const handleAdd = async () => {
    if (!typeLabel.trim()) return;
    setAdding(true);
    try {
      await onAdd({ type_label: typeLabel.trim(), content_mode: contentMode });
      setTypeLabel('');
    } finally {
      setAdding(false);
    }
  };

  return (
    <div style={{ display: 'flex', gap: '8px', flexWrap: 'wrap', alignItems: 'flex-end' }}>
      <div>
        <ThemedInput
          label={t('guitarSong.sections.typeLabel')}
          value={typeLabel}
          onChange={(e) => setTypeLabel(e.target.value)}
          list="new-section-type-suggestions"
        />
        <datalist id="new-section-type-suggestions">
          {typeSuggestions.map((suggestion) => <option key={suggestion} value={suggestion} />)}
        </datalist>
      </div>
      <ThemedSelect
        label={t('guitarSong.sections.contentMode')}
        options={contentModeOptions}
        value={contentMode}
        allowEmpty={false}
        onChange={(value) => setContentMode(value as SectionContentMode)}
      />
      <ThemedButton onClick={handleAdd} disabled={!typeLabel.trim()} isLoading={adding} fullWidth={false}>
        {t('guitarSong.sections.add')}
      </ThemedButton>
    </div>
  );
};
