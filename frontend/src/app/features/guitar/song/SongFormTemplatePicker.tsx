import { ThemedSelect } from '@/app/platform/core/layout/themes/components/ThemedSelect.tsx';

import React from 'react';

import { GuitarSong } from './types.ts';

interface SongFormTemplatePickerProps {
  songs: GuitarSong[];
  value: string;
  onChange: (value: string) => void;
  label: string;
  helperText: string;
  placeholder: string;
}

export const SongFormTemplatePicker: React.FC<SongFormTemplatePickerProps> = ({
  songs, value, onChange, label, helperText, placeholder,
}) => {
  if (songs.length === 0) return null;

  return (
    <ThemedSelect
      label={label}
      helperText={helperText}
      options={songs.map((s) => ({ value: s.id, label: s.title }))}
      value={value}
      onChange={onChange}
      allowEmpty
      placeholder={placeholder}
    />
  );
};
