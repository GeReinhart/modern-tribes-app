import { ThemedCheckbox } from '@/app/platform/core/layout/themes/components/ThemedCheckbox.tsx';
import { ThemedInput } from '@/app/platform/core/layout/themes/components/ThemedInput.tsx';
import { ThemedSubmitButton } from '@/app/platform/core/layout/themes/components/ThemedSubmitButton.tsx';

import React, { useState } from 'react';
import { useTranslation } from 'react-i18next';

import { SongAuthorPicker } from './SongAuthorPicker.tsx';
import { SongFormTemplatePicker } from './SongFormTemplatePicker.tsx';
import { GuitarSongCreate } from './types.ts';
import { useGuitarSongAuthors } from './useGuitarSongAuthors.ts';
import { useGuitarSongs } from './useGuitarSongs.ts';

interface SongFormProps {
  projectId: string | null;
  onSubmit: (data: GuitarSongCreate) => Promise<void>;
  onCancel: () => void;
}

export const SongForm: React.FC<SongFormProps> = ({ projectId, onSubmit, onCancel }) => {
  const { t } = useTranslation();
  const authors = useGuitarSongAuthors(projectId);
  const { songs: existingSongs } = useGuitarSongs(projectId || '');
  const [title, setTitle] = useState('');
  const [author, setAuthor] = useState('');
  const [copyFromSongId, setCopyFromSongId] = useState('');
  const [templateSongId, setTemplateSongId] = useState('');
  const [blankLayout, setBlankLayout] = useState(false);
  const [saving, setSaving] = useState(false);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!title.trim()) return;
    setSaving(true);
    try {
      await onSubmit({
        title: title.trim(),
        author: author.trim() || null,
        copy_from_song_id: copyFromSongId || null,
        ...(copyFromSongId ? {} : { template_song_id: blankLayout ? null : (templateSongId || null), blank_layout: blankLayout }),
      });
    } finally {
      setSaving(false);
    }
  };

  return (
    <form onSubmit={handleSubmit} style={{ display: 'flex', flexDirection: 'column', gap: '16px' }}>
      <ThemedInput
        label={t('guitarSong.form.title')}
        value={title}
        onChange={(e) => setTitle(e.target.value)}
        maxLength={255}
        required
      />
      <SongAuthorPicker authors={authors} value={author} onChange={setAuthor} />
      <SongFormTemplatePicker
        songs={existingSongs}
        value={copyFromSongId}
        onChange={setCopyFromSongId}
        label={t('guitarSong.form.copyFromSong')}
        helperText={t('guitarSong.form.copyFromSongHelp')}
        placeholder={t('guitarSong.form.copyFromSongPlaceholder')}
      />
      {!copyFromSongId && (
        <>
          <ThemedCheckbox
            label={t('guitarSong.form.blankLayout')}
            helperText={t('guitarSong.form.blankLayoutHelp')}
            checked={blankLayout}
            onChange={setBlankLayout}
          />
          {!blankLayout && (
            <SongFormTemplatePicker
              songs={existingSongs}
              value={templateSongId}
              onChange={setTemplateSongId}
              label={t('guitarSong.form.template')}
              helperText={t('guitarSong.form.templateHelp')}
              placeholder={t('guitarSong.form.templatePlaceholder')}
            />
          )}
        </>
      )}
      <div style={{ display: 'flex', justifyContent: 'flex-end', gap: '8px' }}>
        <ThemedSubmitButton type="button" variant="ghost" fullWidth={false} onClick={onCancel}>
          {t('common.cancel')}
        </ThemedSubmitButton>
        <ThemedSubmitButton type="submit" fullWidth={false} isLoading={saving} disabled={!title.trim()}>
          {t('common.create')}
        </ThemedSubmitButton>
      </div>
    </form>
  );
};
