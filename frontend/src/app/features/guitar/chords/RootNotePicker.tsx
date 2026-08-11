import { LevelOption, ThemedLevelPicker } from '@/app/platform/core/layout/themes/components/ThemedLevelPicker.tsx';
import { useTheme } from '@/app/platform/core/layout/themes/ThemeContext.tsx';

import React from 'react';

import { ROOT_NOTE_OPTIONS } from './fretOptions.ts';

interface RootNotePickerProps {
  label: string;
  value: string;
  onChange: (value: string) => void;
  disabled?: boolean;
}

export const RootNotePicker: React.FC<RootNotePickerProps> = ({ label, value, onChange, disabled }) => {
  const { theme } = useTheme();
  const options: LevelOption<string>[] = ROOT_NOTE_OPTIONS.map((note) => ({
    value: note.value,
    color: theme.colors.accent,
    caption: note.label,
  }));

  return (
    <div>
      <span className="block text-sm font-medium mb-1">{label}</span>
      <ThemedLevelPicker
        options={options}
        value={value || null}
        onChange={onChange}
        onDeselect={() => onChange('')}
        ariaLabelPrefix={label}
        disabled={disabled}
      />
    </div>
  );
};
