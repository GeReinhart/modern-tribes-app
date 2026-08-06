import { ThemedSelect } from '@/app/platform/core/layout/themes/components/ThemedSelect.tsx';

import React from 'react';
import { useTranslation } from 'react-i18next';

import { GuitarSong } from './types.ts';

interface SongFormTemplatePickerProps {
  songs: GuitarSong[];
  value: string;
  onChange: (value: string) => void;
}

export const SongFormTemplatePicker: React.FC<SongFormTemplatePickerProps> = ({ songs, value, onChange }) => {
  const { t } = useTranslation();

  if (songs.length === 0) return null;

  return (
    <ThemedSelect
      label={t('guitarSong.form.template')}
      helperText={t('guitarSong.form.templateHelp')}
      options={songs.map((s) => ({ value: s.id, label: s.title }))}
      value={value}
      onChange={onChange}
      allowEmpty
      placeholder={t('guitarSong.form.templatePlaceholder')}
    />
  );
};
