import { ThemedButton } from '@/app/platform/core/layout/themes/components/ThemedButton.tsx';
import { ThemedInput } from '@/app/platform/core/layout/themes/components/ThemedInput.tsx';
import { ThemedSelect } from '@/app/platform/core/layout/themes/components/ThemedSelect.tsx';
import { useTheme } from '@/app/platform/core/layout/themes/ThemeContext.tsx';
import { ThemedSvgIcon } from '@/app/platform/core/layout/themes/icons/ThemedSvgIcon.tsx';

import React, { useState } from 'react';
import { useTranslation } from 'react-i18next';

import { GuitarSongAuthor } from './types.ts';

interface SongAuthorPickerProps {
  authors: GuitarSongAuthor[];
  value: string;
  onChange: (value: string) => void;
  // Called with a value that's ready to be persisted: picking an author from the dropdown
  // (including clearing it), or leaving the new-author field after typing in it. Not called
  // while merely switching into or out of "adding new" mode, since that's not a value change
  // by itself. Callers that only persist on their own later action (e.g. a form's submit) can
  // leave this unset.
  onCommit?: (value: string) => void;
}

export const SongAuthorPicker: React.FC<SongAuthorPickerProps> = ({ authors, value, onChange, onCommit }) => {
  const { t } = useTranslation();
  const { theme } = useTheme();
  const [addingNew, setAddingNew] = useState(false);

  const options = authors.map((a) => ({ value: a.name, label: a.name }));

  const handleAddNew = () => {
    setAddingNew(true);
    onChange('');
  };

  const handleCancelNew = () => {
    setAddingNew(false);
    onChange('');
  };

  const handleSelect = (selected: string) => {
    onChange(selected);
    onCommit?.(selected);
  };

  if (addingNew) {
    return (
      <div style={{ display: 'flex', gap: '8px', alignItems: 'flex-end' }}>
        <ThemedInput
          label={t('guitarSong.form.author')}
          value={value}
          onChange={(e) => onChange(e.target.value)}
          onBlur={() => onCommit?.(value)}
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
    <div style={{ display: 'flex', gap: '8px', alignItems: 'flex-end' }}>
      <ThemedSelect
        label={t('guitarSong.form.author')}
        options={options}
        value={value}
        onChange={handleSelect}
        allowEmpty
        placeholder={t('guitarSong.form.authorPlaceholder')}
      />
      <button
        type="button"
        onClick={handleAddNew}
        title={t('guitarSong.form.addNewAuthor')}
        aria-label={t('guitarSong.form.addNewAuthor')}
        style={{
          display: 'flex', alignItems: 'center', justifyContent: 'center',
          width: '42px', height: '42px', flexShrink: 0,
          borderRadius: 'var(--radius-md)', border: `1px solid ${theme.colors.primary}40`,
          background: 'none', color: theme.colors.primary, cursor: 'pointer',
        }}
      >
        <ThemedSvgIcon name="plus" color="currentColor" size={18} />
      </button>
    </div>
  );
};
