import { ThemedInput } from '@/app/platform/core/layout/themes/components/ThemedInput.tsx';
import { ThemedSelect } from '@/app/platform/core/layout/themes/components/ThemedSelect.tsx';
import { ThemedSubmitButton } from '@/app/platform/core/layout/themes/components/ThemedSubmitButton.tsx';

import React, { useState } from 'react';
import { useTranslation } from 'react-i18next';

import { ChordDiagramSize, ChordDiagramStyle } from '../chords/ChordDiagram.tsx';
import {
  MAX_BEATS_PER_BAR,
  MAX_CAPO,
  MAX_TEMPO_BPM,
  MIN_BEATS_PER_BAR,
  MIN_CAPO,
  MIN_TEMPO_BPM,
} from './songLimits.ts';
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
  const [capo, setCapo] = useState(song?.capo ?? 0);
  const [diagramStyle, setDiagramStyle] = useState<ChordDiagramStyle>(song?.chord_diagram_style ?? 'full');
  const [diagramSize, setDiagramSize] = useState<ChordDiagramSize>(song?.chord_diagram_size ?? 'medium');
  const [saving, setSaving] = useState(false);

  const diagramStyleOptions = [
    { value: 'full', label: t('guitarSong.form.diagramStyleFull') },
    { value: 'simple', label: t('guitarSong.form.diagramStyleSimple') },
  ];
  const diagramSizeOptions = [
    { value: 'small', label: t('guitarSong.form.diagramSizeSmall') },
    { value: 'medium', label: t('guitarSong.form.diagramSizeMedium') },
    { value: 'large', label: t('guitarSong.form.diagramSizeLarge') },
  ];

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
        capo,
        chord_diagram_style: diagramStyle,
        chord_diagram_size: diagramSize,
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
      <ThemedInput
        label={t('guitarSong.form.capo')}
        type="number"
        min={MIN_CAPO}
        max={MAX_CAPO}
        value={capo}
        onChange={(e) => setCapo(Number(e.target.value))}
      />
      <ThemedSelect
        label={t('guitarSong.form.diagramStyle')}
        options={diagramStyleOptions}
        value={diagramStyle}
        allowEmpty={false}
        onChange={(value) => setDiagramStyle(value as ChordDiagramStyle)}
      />
      <ThemedSelect
        label={t('guitarSong.form.diagramSize')}
        options={diagramSizeOptions}
        value={diagramSize}
        allowEmpty={false}
        onChange={(value) => setDiagramSize(value as ChordDiagramSize)}
      />
      <div style={{ display: 'flex', justifyContent: 'flex-end', gap: '8px' }}>
        <ThemedSubmitButton type="button" variant="ghost" fullWidth={false} onClick={onCancel}>
          {t('common.cancel')}
        </ThemedSubmitButton>
        <ThemedSubmitButton type="submit" fullWidth={false} isLoading={saving} disabled={!title.trim()}>
          {song ? t('common.update') : t('common.create')}
        </ThemedSubmitButton>
      </div>
    </form>
  );
};
