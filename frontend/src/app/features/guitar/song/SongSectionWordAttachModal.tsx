import { GuitarChord } from '@/app/features/guitar/chords/types.ts';
import { ThemedIconButton } from '@/app/platform/core/layout/themes/components/ThemedIconButton.tsx';
import { ThemedSelect } from '@/app/platform/core/layout/themes/components/ThemedSelect.tsx';
import { ModalBody, ThemedModal } from '@/app/platform/core/layout/themes/components/ThemedModal.tsx';
import { useTheme } from '@/app/platform/core/layout/themes/ThemeContext.tsx';

import React, { useEffect, useState } from 'react';
import { useTranslation } from 'react-i18next';

import { chordAtPosition, WORD_CHORD_POSITIONS } from './sectionWords.ts';
import { GuitarSongSectionWord, GuitarSongSectionWordChordUpdate, WordChordPosition } from './types.ts';

const POSITION_LABEL_KEYS: Record<WordChordPosition, string> = {
  before: 'guitarSong.sections.positionBefore',
  start: 'guitarSong.sections.positionStart',
  middle: 'guitarSong.sections.positionMiddle',
  end: 'guitarSong.sections.positionEnd',
  after: 'guitarSong.sections.positionAfter',
};

interface SongSectionWordAttachModalProps {
  word: GuitarSongSectionWord | null;
  songChords: GuitarChord[];
  onClose: () => void;
  onSetWordChord: (wordId: string, position: WordChordPosition, data: GuitarSongSectionWordChordUpdate) => Promise<void>;
}

export const SongSectionWordAttachModal: React.FC<SongSectionWordAttachModalProps> = ({
  word, songChords, onClose, onSetWordChord,
}) => {
  const { t } = useTranslation();
  const { theme } = useTheme();
  const [positionIndex, setPositionIndex] = useState(1);

  useEffect(() => {
    if (word) setPositionIndex(1);
  }, [word?.id]);

  const chordOptions = songChords.map((chord) => ({ value: chord.id, label: chord.name }));
  const title = word?.text || t('guitarSong.sections.emptySlotLabel');
  const position = WORD_CHORD_POSITIONS[positionIndex];

  return (
    <ThemedModal isOpen={word !== null} onClose={onClose} title={title} size="sm">
      <ModalBody>
        {word && (
          <div style={{ display: 'flex', flexDirection: 'column', gap: '12px' }}>
            <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'center', gap: '12px' }}>
              <ThemedIconButton
                action={{
                  icon: 'arrow-left',
                  label: t('guitarSong.sections.previousPosition'),
                  onClick: () => setPositionIndex((i) => i - 1),
                  disabled: positionIndex === 0,
                }}
              />
              <span style={{ minWidth: '70px', textAlign: 'center', fontWeight: 600, color: theme.colors.text }}>
                {t(POSITION_LABEL_KEYS[position])}
              </span>
              <ThemedIconButton
                action={{
                  icon: 'arrow-right',
                  label: t('guitarSong.sections.nextPosition'),
                  onClick: () => setPositionIndex((i) => i + 1),
                  disabled: positionIndex === WORD_CHORD_POSITIONS.length - 1,
                }}
              />
            </div>
            <div style={{ display: 'flex', justifyContent: 'center', gap: '6px' }}>
              {WORD_CHORD_POSITIONS.map((p, i) => (
                <button
                  key={p}
                  type="button"
                  onClick={() => setPositionIndex(i)}
                  title={t(POSITION_LABEL_KEYS[p])}
                  style={{
                    width: '8px',
                    height: '8px',
                    borderRadius: '50%',
                    padding: 0,
                    cursor: 'pointer',
                    border: `1px solid ${theme.colors.primary}`,
                    background: chordAtPosition(word, p) ? theme.colors.primary : 'transparent',
                    opacity: i === positionIndex ? 1 : 0.5,
                  }}
                />
              ))}
            </div>
            <ThemedSelect
              options={chordOptions}
              value={chordAtPosition(word, position)?.id ?? ''}
              allowEmpty
              placeholder={t('guitarSong.sections.noChord')}
              onChange={(value) => onSetWordChord(word.id, position, { chord_id: value || null })}
            />
          </div>
        )}
      </ModalBody>
    </ThemedModal>
  );
};
