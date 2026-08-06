import { GuitarChord } from '@/app/features/guitar/chords/types.ts';
import { ModalBody, ThemedModal } from '@/app/platform/core/layout/themes/components/ThemedModal.tsx';
import { ThemedIconButton } from '@/app/platform/core/layout/themes/components/ThemedIconButton.tsx';
import { useTheme } from '@/app/platform/core/layout/themes/ThemeContext.tsx';

import React, { useEffect, useState } from 'react';
import { useTranslation } from 'react-i18next';

import { chordAtPosition } from './lyricsWords.ts';
import { GuitarSongLyricsWord, GuitarSongLyricsWordChordUpdate, WordChordPosition } from './types.ts';

const POSITION_LABEL_KEYS: Record<WordChordPosition, string> = {
  before: 'guitarSong.sections.positionBefore',
  start: 'guitarSong.sections.positionStart',
  middle: 'guitarSong.sections.positionMiddle',
  end: 'guitarSong.sections.positionEnd',
  after: 'guitarSong.sections.positionAfter',
};

interface WordPositionPickerProps {
  word: GuitarSongLyricsWord;
  activePosition: WordChordPosition;
  onSelectPosition: (position: WordChordPosition) => void;
  hasPrevWord: boolean;
  hasNextWord: boolean;
  onPrevWord: () => void;
  onNextWord: () => void;
}

// A live preview of the word laid out exactly like it will be in the presentation view (before /
// start-middle-end / after around the word text), except every slot -- filled or not -- is its
// own clickable target, so picking a chord below visibly lands in the right spot. The word text
// itself is flanked by prev/next-word arrows, so a chord sequence across several words can be
// entered without closing the popup and re-picking a word from the lyrics behind it each time.
const WordPositionPicker: React.FC<WordPositionPickerProps> = ({
  word, activePosition, onSelectPosition, hasPrevWord, hasNextWord, onPrevWord, onNextWord,
}) => {
  const { theme } = useTheme();
  const { t } = useTranslation();

  const slot = (position: WordChordPosition) => {
    const chord = chordAtPosition(word, position);
    const active = position === activePosition;
    return (
      <button
        key={position}
        type="button"
        onClick={() => onSelectPosition(position)}
        title={t(POSITION_LABEL_KEYS[position])}
        style={{
          minWidth: '32px',
          height: '22px',
          padding: '0 4px',
          borderRadius: '4px',
          border: `1px dashed ${active ? theme.colors.primary : theme.colors.border}`,
          background: active ? `${theme.colors.primary}20` : 'transparent',
          fontSize: '11px',
          fontWeight: 700,
          color: chord ? theme.colors.primary : theme.colors.secondary,
          cursor: 'pointer',
        }}
      >
        {chord?.name ?? ''}
      </button>
    );
  };

  return (
    <div style={{ display: 'flex', alignItems: 'flex-start', gap: '4px' }}>
      {slot('before')}
      <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', gap: '4px' }}>
        <div style={{ display: 'flex', gap: '4px' }}>
          {slot('start')}
          {slot('middle')}
          {slot('end')}
        </div>
        <div style={{ display: 'flex', alignItems: 'center', gap: '6px' }}>
          <ThemedIconButton
            action={{ icon: 'arrow-left', label: t('guitarSong.sections.previousWord'), onClick: onPrevWord, disabled: !hasPrevWord }}
          />
          <div style={{ color: theme.colors.text }}>{word.text || t('guitarSong.sections.emptySlotLabel')}</div>
          <ThemedIconButton
            action={{ icon: 'arrow-right', label: t('guitarSong.sections.nextWord'), onClick: onNextWord, disabled: !hasNextWord }}
          />
        </div>
      </div>
      {slot('after')}
    </div>
  );
};

interface SongLyricsWordAttachModalProps {
  word: GuitarSongLyricsWord | null;
  // The word's own position -- GuitarSongLyricsWord carries no id, so its coordinate in the
  // nested lyrics_words array is its identity.
  lineIndex: number | null;
  wordIndex: number | null;
  songChords: GuitarChord[];
  onClose: () => void;
  onSetWordChord: (
    lineIndex: number, wordIndex: number, position: WordChordPosition, data: GuitarSongLyricsWordChordUpdate,
  ) => Promise<void>;
  hasPrevWord: boolean;
  hasNextWord: boolean;
  onPrevWord: () => void;
  onNextWord: () => void;
}

export const SongLyricsWordAttachModal: React.FC<SongLyricsWordAttachModalProps> = ({
  word, lineIndex, wordIndex, songChords, onClose, onSetWordChord, hasPrevWord, hasNextWord, onPrevWord, onNextWord,
}) => {
  const { t } = useTranslation();
  const { theme } = useTheme();
  const [position, setPosition] = useState<WordChordPosition>('start');

  useEffect(() => {
    if (word) setPosition('start');
  }, [lineIndex, wordIndex]);

  const title = word?.text || t('guitarSong.sections.emptySlotLabel');
  const activeChordId = word ? chordAtPosition(word, position)?.id ?? null : null;

  const pick = (chordId: string | null) => {
    if (!word || lineIndex === null || wordIndex === null) return;
    onSetWordChord(lineIndex, wordIndex, position, { chord_id: chordId });
  };

  const chordButtonStyle = (selected: boolean): React.CSSProperties => ({
    padding: '4px 10px',
    borderRadius: 'var(--radius-md)',
    border: `1px solid ${selected ? theme.colors.primary : theme.colors.border}`,
    background: selected ? `${theme.colors.primary}20` : 'transparent',
    color: theme.colors.text,
    fontWeight: 600,
    cursor: 'pointer',
  });

  return (
    <ThemedModal isOpen={word !== null} onClose={onClose} title={title} size="sm">
      <ModalBody>
        {word && (
          <div style={{ display: 'flex', flexDirection: 'column', gap: '16px' }}>
            <div style={{ display: 'flex', justifyContent: 'center' }}>
              <WordPositionPicker
                word={word} activePosition={position} onSelectPosition={setPosition}
                hasPrevWord={hasPrevWord} hasNextWord={hasNextWord} onPrevWord={onPrevWord} onNextWord={onNextWord}
              />
            </div>
            <div style={{ display: 'flex', flexWrap: 'wrap', gap: '6px', justifyContent: 'center' }}>
              <button type="button" onClick={() => pick(null)} style={chordButtonStyle(activeChordId === null)}>
                {t('guitarSong.sections.noChord')}
              </button>
              {songChords.map((chord) => (
                <button
                  key={chord.id}
                  type="button"
                  onClick={() => pick(chord.id)}
                  style={chordButtonStyle(activeChordId === chord.id)}
                >
                  {chord.name}
                </button>
              ))}
            </div>
          </div>
        )}
      </ModalBody>
    </ThemedModal>
  );
};
