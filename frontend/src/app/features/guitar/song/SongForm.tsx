import { ThemedInput } from '@/app/platform/core/layout/themes/components/ThemedInput.tsx';
import { ThemedSubmitButton } from '@/app/platform/core/layout/themes/components/ThemedSubmitButton.tsx';

import React, { useState } from 'react';
import { useTranslation } from 'react-i18next';

import { MAX_BEATS_PER_BAR, MAX_TEMPO_BPM, MIN_BEATS_PER_BAR, MIN_TEMPO_BPM } from './songLimits.ts';
import { GuitarSong, GuitarSongCreate } from './types.ts';

interface SongFormProps {
  song?: GuitarSong;
  onSubmit: (data: GuitarSongCreate) => Promise<void>;
  onCancel: () => void;
}

export const SongForm: React.FC<SongFormProps> = ({ song, onSubmit, onCancel }) => {
  const { t } = useTranslation();
  const [title, setTitle] = useState(song?.title ?? '');
  const [author, setAuthor] = useState(song?.author ?? '');
  const [tempoBpm, setTempoBpm] = useState(song?.tempo_bpm ?? 120);
  const [beatsPerBar, setBeatsPerBar] = useState(song?.beats_per_bar ?? 4);
  const [saving, setSaving] = useState(false);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!title.trim()) return;
    setSaving(true);
    try {
      await onSubmit({
        title: title.trim(),
        author: author.trim() || null,
        tempo_bpm: tempoBpm,
        beats_per_bar: beatsPerBar,
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
      <ThemedInput
        label={t('guitarSong.form.author')}
        value={author}
        onChange={(e) => setAuthor(e.target.value)}
        maxLength={255}
      />
      <ThemedInput
        label={t('guitarSong.form.tempoBpm')}
        type="number"
        min={MIN_TEMPO_BPM}
        max={MAX_TEMPO_BPM}
        value={tempoBpm}
        onChange={(e) => setTempoBpm(Number(e.target.value))}
      />
      <ThemedInput
        label={t('guitarSong.form.beatsPerBar')}
        type="number"
        min={MIN_BEATS_PER_BAR}
        max={MAX_BEATS_PER_BAR}
        value={beatsPerBar}
        onChange={(e) => setBeatsPerBar(Number(e.target.value))}
      />
      <div style={{ display: 'flex', justifyContent: 'flex-end', gap: '8px' }}>
        <ThemedSubmitButton type="button" variant="ghost" fullWidth={false} onClick={onCancel}>
          {t('common.cancel')}
        </ThemedSubmitButton>
        <ThemedSubmitButton type="submit" fullWidth={false} isLoading={saving} disabled={!title.trim()}>
          {t('common.save')}
        </ThemedSubmitButton>
      </div>
    </form>
  );
};
