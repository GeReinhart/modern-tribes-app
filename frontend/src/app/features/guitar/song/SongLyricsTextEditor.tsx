import { ChordDiagramSize, ChordDiagramStyle } from '@/app/features/guitar/chords/ChordDiagram.tsx';
import { GuitarChord } from '@/app/features/guitar/chords/types.ts';
import { ThemedButton } from '@/app/platform/core/layout/themes/components/ThemedButton.tsx';
import { ThemedTextarea } from '@/app/platform/core/layout/themes/components/ThemedTextarea.tsx';

import React, { useState } from 'react';
import { useTranslation } from 'react-i18next';

import { SongLyricsAttachMode } from './SongLyricsAttachMode.tsx';
import { GuitarSongLyricsWord, GuitarSongLyricsWordChordUpdate, WordChordPosition } from './types.ts';

interface SongLyricsTextEditorProps {
  lyricsText: string;
  lyricsWords: GuitarSongLyricsWord[][] | null;
  songChords: GuitarChord[];
  diagramStyle: ChordDiagramStyle;
  diagramSize: ChordDiagramSize;
  textSizePx: number;
  chordSizePx: number;
  onSaveText: (text: string) => Promise<void>;
  onSetWordChord: (
    lineIndex: number, wordIndex: number, position: WordChordPosition, data: GuitarSongLyricsWordChordUpdate,
  ) => Promise<void>;
}

export const SongLyricsTextEditor: React.FC<SongLyricsTextEditorProps> = ({
  lyricsText,
  lyricsWords,
  songChords,
  diagramStyle,
  diagramSize,
  textSizePx,
  chordSizePx,
  onSaveText,
  onSetWordChord,
}) => {
  const { t } = useTranslation();
  const [text, setText] = useState(lyricsText);
  const [savedText, setSavedText] = useState(lyricsText);
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

  // Attach mode replaces the text editor entirely -- it works off the saved lyrics_words, which
  // only reflect the text once it's been saved, so there is nothing left to edit or save here
  // until the user leaves attach mode.
  if (attachMode) {
    return (
      <div style={{ display: 'flex', flexDirection: 'column', gap: '8px' }}>
        <SongLyricsAttachMode
          lines={lyricsWords ?? []} songChords={songChords} diagramStyle={diagramStyle} diagramSize={diagramSize}
          textSizePx={textSizePx} chordSizePx={chordSizePx} onSetWordChord={onSetWordChord}
        />
        <ThemedButton variant="ghost" onClick={() => setAttachMode(false)} fullWidth={false}>
          {t('guitarSong.sections.hideAttachChords')}
        </ThemedButton>
      </div>
    );
  }

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
        {/* Attaching chords works off the saved lyrics_words, which only reflect the text once
            it's been saved -- offering it over unsaved text would attach chords to words that
            are about to be replaced or don't exist yet. */}
        {!dirty && (
          <ThemedButton variant="ghost" onClick={() => setAttachMode(true)} fullWidth={false}>
            {t('guitarSong.sections.attachChords')}
          </ThemedButton>
        )}
      </div>
    </div>
  );
};
