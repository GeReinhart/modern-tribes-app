import { ThemedButton } from '@/app/platform/core/layout/themes/components/ThemedButton.tsx';
import { ThemedInput } from '@/app/platform/core/layout/themes/components/ThemedInput.tsx';
import { ThemedSelect } from '@/app/platform/core/layout/themes/components/ThemedSelect.tsx';

import React, { useState } from 'react';
import { useTranslation } from 'react-i18next';

import { GuitarSongAuthor } from './types.ts';

const NEW_AUTHOR_VALUE = '__new_author__';

interface SongAuthorPickerProps {
  authors: GuitarSongAuthor[];
  value: string;
  onChange: (value: string) => void;
}

export const SongAuthorPicker: React.FC<SongAuthorPickerProps> = ({ authors, value, onChange }) => {
  const { t } = useTranslation();
  const [addingNew, setAddingNew] = useState(false);

  const options = [
    ...authors.map((a) => ({ value: a.name, label: a.name })),
    { value: NEW_AUTHOR_VALUE, label: t('guitarSong.form.addNewAuthor') },
  ];

  const handleSelectChange = (selected: string) => {
    if (selected === NEW_AUTHOR_VALUE) {
      setAddingNew(true);
      onChange('');
    } else {
      onChange(selected);
    }
  };

  const handleCancelNew = () => {
    setAddingNew(false);
    onChange('');
  };

  if (addingNew) {
    return (
      <div style={{ display: 'flex', gap: '8px', alignItems: 'flex-end' }}>
        <ThemedInput
          label={t('guitarSong.form.author')}
          value={value}
          onChange={(e) => onChange(e.target.value)}
          placeholder={t('guitarSong.form.newAuthorPlaceholder')}
          maxLength={255}
          autoFocus
        />
        <ThemedButton variant="ghost" fullWidth={false} onClick={handleCancelNew}>
          {t('common.cancel')}
        </ThemedButton>
      </div>
    );
  }

  return (
    <ThemedSelect
      label={t('guitarSong.form.author')}
      options={options}
      value={value}
      onChange={handleSelectChange}
      allowEmpty
      placeholder={t('guitarSong.form.authorPlaceholder')}
    />
  );
};
