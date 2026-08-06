import { GuitarChord } from '@/app/features/guitar/chords/types.ts';
import { useTheme } from '@/app/platform/core/layout/themes/ThemeContext.tsx';

import React, { useState } from 'react';
import { useTranslation } from 'react-i18next';

import { chordAtPosition, groupWordsByLine, WORD_CHORD_POSITIONS } from './sectionWords.ts';
import { SongSectionWordAttachModal } from './SongSectionWordAttachModal.tsx';
import { GuitarSongSection, GuitarSongSectionWord, GuitarSongSectionWordChordUpdate, WordChordPosition } from './types.ts';

interface SongSectionAttachModeProps {
  section: GuitarSongSection;
  songChords: GuitarChord[];
  onSetWordChord: (wordId: string, position: WordChordPosition, data: GuitarSongSectionWordChordUpdate) => Promise<void>;
}

export const SongSectionAttachMode: React.FC<SongSectionAttachModeProps> = ({
  section,
  songChords,
  onSetWordChord,
}) => {
  const { theme } = useTheme();
  const { t } = useTranslation();
  const [activeWordId, setActiveWordId] = useState<string | null>(null);
  const lines = groupWordsByLine(section.words);
  const activeWord = section.words.find((word) => word.id === activeWordId) ?? null;

  const filledCount = (word: GuitarSongSectionWord) =>
    WORD_CHORD_POSITIONS.filter((position) => chordAtPosition(word, position)).length;

  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: '10px' }}>
      {lines.map((line, lineIndex) => (
        <div key={lineIndex} style={{ display: 'flex', flexWrap: 'wrap', gap: '8px' }}>
          {line.map((word) => (
            <button
              key={word.id}
              type="button"
              onClick={() => setActiveWordId(word.id)}
              style={{
                display: 'flex',
                flexDirection: 'column',
                alignItems: 'center',
                gap: '2px',
                border: `1px dashed ${theme.colors.border}`,
                borderRadius: '6px',
                padding: '4px 8px',
                minWidth: '48px',
                background: 'transparent',
                cursor: 'pointer',
                color: theme.colors.text,
              }}
            >
              <span style={{ fontStyle: word.text ? 'normal' : 'italic', opacity: word.text ? 1 : 0.6 }}>
                {word.text || t('guitarSong.sections.emptySlotLabel')}
              </span>
              {filledCount(word) > 0 && (
                <span style={{ fontSize: '10px', fontWeight: 700, color: theme.colors.primary }}>
                  {filledCount(word)} ♪
                </span>
              )}
            </button>
          ))}
        </div>
      ))}
      <SongSectionWordAttachModal
        word={activeWord}
        songChords={songChords}
        onClose={() => setActiveWordId(null)}
        onSetWordChord={onSetWordChord}
      />
    </div>
  );
};
