import { GuitarChord } from '@/app/features/guitar/chords/types.ts';
import { ThemedButton } from '@/app/platform/core/layout/themes/components/ThemedButton.tsx';
import { ThemedTextarea } from '@/app/platform/core/layout/themes/components/ThemedTextarea.tsx';

import React, { useState } from 'react';
import { useTranslation } from 'react-i18next';

import { SongSectionAttachMode } from './SongSectionAttachMode.tsx';
import { GuitarSongSection, GuitarSongSectionWordChordUpdate, WordChordPosition } from './types.ts';

interface SongSectionLyricsEditorProps {
  section: GuitarSongSection;
  songChords: GuitarChord[];
  onSaveText: (text: string) => Promise<void>;
  onSetWordChord: (wordId: string, position: WordChordPosition, data: GuitarSongSectionWordChordUpdate) => Promise<void>;
}

export const SongSectionLyricsEditor: React.FC<SongSectionLyricsEditorProps> = ({
  section,
  songChords,
  onSaveText,
  onSetWordChord,
}) => {
  const { t } = useTranslation();
  const [text, setText] = useState(section.lyrics_text ?? '');
  const [savedText, setSavedText] = useState(section.lyrics_text ?? '');
  const [attachMode, setAttachMode] = useState(false);
  const [saving, setSaving] = useState(false);

  const dirty = text !== savedText;

  const handleSave = async () => {
    setSaving(true);
    try {
      await onSaveText(text);
      setSavedText(text);
    } finally {
      setSaving(false);
    }
  };

  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: '8px' }}>
      <ThemedTextarea
        value={text}
        onChange={(e) => setText(e.target.value)}
        rows={4}
        placeholder={t('guitarSong.sections.lyricsPlaceholder')}
      />
      <div style={{ display: 'flex', gap: '8px' }}>
        <ThemedButton onClick={handleSave} disabled={!dirty} isLoading={saving} fullWidth={false}>
          {t('common.save')}
        </ThemedButton>
        <ThemedButton variant="ghost" onClick={() => setAttachMode(!attachMode)} fullWidth={false}>
          {attachMode ? t('guitarSong.sections.hideAttachChords') : t('guitarSong.sections.attachChords')}
        </ThemedButton>
      </div>
      {attachMode && (
        <SongSectionAttachMode section={section} songChords={songChords} onSetWordChord={onSetWordChord} />
      )}
    </div>
  );
};
