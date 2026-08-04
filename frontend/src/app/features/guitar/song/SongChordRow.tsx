import { ChordDiagram } from '@/app/features/guitar/chords/ChordDiagram.tsx';
import { ThemedCard } from '@/app/platform/core/layout/themes/components/ThemedCard.tsx';
import { ThemedIconButton } from '@/app/platform/core/layout/themes/components/ThemedIconButton.tsx';
import { ThemedInput } from '@/app/platform/core/layout/themes/components/ThemedInput.tsx';
import { useTheme } from '@/app/platform/core/layout/themes/ThemeContext.tsx';

import React, { useState } from 'react';
import { useTranslation } from 'react-i18next';

import { GuitarSongChord } from './types.ts';

interface SongChordRowProps {
  songChord: GuitarSongChord;
  isFirst: boolean;
  isLast: boolean;
  onMoveUp: () => void;
  onMoveDown: () => void;
  onRemove: () => void;
  onCommentBlur: (comment: string) => void;
}

export const SongChordRow: React.FC<SongChordRowProps> = ({
  songChord,
  isFirst,
  isLast,
  onMoveUp,
  onMoveDown,
  onRemove,
  onCommentBlur,
}) => {
  const { theme } = useTheme();
  const { t } = useTranslation();
  const [comment, setComment] = useState(songChord.comment ?? '');

  const handleBlur = () => {
    if (comment !== (songChord.comment ?? '')) onCommentBlur(comment);
  };

  return (
    <ThemedCard bordered className="flex gap-3 p-3 items-start">
      <div style={{ display: 'flex', flexDirection: 'column', gap: '4px' }}>
        <ThemedIconButton
          action={{ icon: 'chevron-up', label: t('guitarSong.detail.moveUp'), onClick: onMoveUp, disabled: isFirst }}
        />
        <ThemedIconButton
          action={{ icon: 'chevron-down', label: t('guitarSong.detail.moveDown'), onClick: onMoveDown, disabled: isLast }}
        />
      </div>
      <div style={{ display: 'flex', flexDirection: 'column', gap: '2px', alignItems: 'center' }}>
        <div style={{ fontWeight: 700, color: theme.colors.text }}>{songChord.chord.name}</div>
        <ChordDiagram frets={songChord.chord.frets} rootNote={songChord.chord.root_note} />
      </div>
      <div style={{ flex: 1, minWidth: '160px' }}>
        <ThemedInput
          label={t('guitarSong.detail.comment')}
          value={comment}
          onChange={(e) => setComment(e.target.value)}
          onBlur={handleBlur}
          placeholder={t('guitarSong.detail.commentPlaceholder')}
        />
      </div>
      <ThemedIconButton
        action={{ icon: 'trash', label: t('guitarSong.detail.removeChord'), onClick: onRemove, variant: 'danger' }}
      />
    </ThemedCard>
  );
};
