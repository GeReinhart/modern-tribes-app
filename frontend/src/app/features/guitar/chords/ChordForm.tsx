import { ThemedInput } from '@/app/platform/core/layout/themes/components/ThemedInput.tsx';
import { ThemedSelect } from '@/app/platform/core/layout/themes/components/ThemedSelect.tsx';
import { ThemedSubmitButton } from '@/app/platform/core/layout/themes/components/ThemedSubmitButton.tsx';
import { ThemedTextarea } from '@/app/platform/core/layout/themes/components/ThemedTextarea.tsx';

import React, { useState } from 'react';
import { useTranslation } from 'react-i18next';

import { ChordDiagram } from './ChordDiagram.tsx';
import { ChordDifficultyPicker } from './ChordDifficultyPicker.tsx';
import { proposeRootNote } from './chordTheory.ts';
import { DEFAULT_FRETS, ROOT_NOTE_OPTIONS } from './fretOptions.ts';
import { FretSelectors } from './FretSelectors.tsx';
import { FretValue, GuitarChord, GuitarChordCreate } from './types.ts';

interface ChordFormProps {
  chord?: GuitarChord;
  onSubmit: (data: GuitarChordCreate) => Promise<void>;
  onCancel: () => void;
}

const toFretValues = (frets: string[]): FretValue[] =>
  frets.map((f) => (f === 'X' ? 'X' : Number(f)));

const toFretStrings = (frets: FretValue[]): string[] => frets.map((f) => String(f));

export const ChordForm: React.FC<ChordFormProps> = ({ chord, onSubmit, onCancel }) => {
  const { t } = useTranslation();
  const [name, setName] = useState(chord?.name ?? '');
  const [rootNote, setRootNote] = useState(chord?.root_note ?? '');
  const [description, setDescription] = useState(chord?.description ?? '');
  const [frets, setFrets] = useState<string[]>(chord ? toFretStrings(chord.frets) : DEFAULT_FRETS);
  const [difficulty, setDifficulty] = useState<number | null>(chord?.difficulty ?? null);
  const [rootTouched, setRootTouched] = useState(Boolean(chord));
  const [saving, setSaving] = useState(false);

  const handleNameChange = (value: string) => {
    setName(value);
    if (!rootTouched) {
      const proposed = proposeRootNote(value);
      if (proposed) setRootNote(proposed);
    }
  };

  const handleFretChange = (stringIndex: number, value: string) => {
    setFrets((prev) => prev.map((f, i) => (i === stringIndex ? value : f)));
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!name.trim() || !rootNote) return;
    setSaving(true);
    try {
      await onSubmit({
        name: name.trim(),
        root_note: rootNote,
        description: description.trim() || null,
        frets: toFretValues(frets),
        difficulty,
      });
    } finally {
      setSaving(false);
    }
  };

  return (
    <form onSubmit={handleSubmit} style={{ display: 'flex', flexDirection: 'column', gap: '16px' }}>
      <ThemedInput
        label={t('guitarChords.form.name')}
        value={name}
        onChange={(e) => handleNameChange(e.target.value)}
        maxLength={50}
        required
      />
      <ThemedSelect
        label={t('guitarChords.form.rootNote')}
        options={ROOT_NOTE_OPTIONS}
        value={rootNote}
        allowEmpty={false}
        onChange={(value) => { setRootNote(value); setRootTouched(true); }}
      />
      <ThemedTextarea
        label={t('guitarChords.form.description')}
        value={description ?? ''}
        onChange={(e) => setDescription(e.target.value)}
        rows={2}
      />
      <FretSelectors frets={frets} onChange={handleFretChange} />
      {rootNote && <ChordDiagram frets={toFretValues(frets)} rootNote={rootNote} />}
      <div>
        <div style={{ fontSize: 'var(--font-sm)', marginBottom: '6px' }}>{t('guitarChords.difficulty.label')}</div>
        <ChordDifficultyPicker value={difficulty} onChange={setDifficulty} />
      </div>
      <div style={{ display: 'flex', justifyContent: 'flex-end', gap: '8px' }}>
        <ThemedSubmitButton type="button" variant="ghost" fullWidth={false} onClick={onCancel}>
          {t('common.cancel')}
        </ThemedSubmitButton>
        <ThemedSubmitButton type="submit" fullWidth={false} isLoading={saving} disabled={!name.trim() || !rootNote}>
          {t('common.save')}
        </ThemedSubmitButton>
      </div>
    </form>
  );
};
